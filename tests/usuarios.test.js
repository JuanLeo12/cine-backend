const request = require("supertest");
const app = require("../app");
const sequelize = require("../config/db");
const Usuario = require("../models/usuario");

beforeAll(async () => {
  await sequelize.sync({ force: true }); // limpia BD antes de tests
});

afterAll(async () => {
  await sequelize.close();
});

describe("Usuarios API", () => {
  let tokenCliente;
  let clienteId;

  const clienteData = {
    nombre: "Juan",
    apellido: "Perez",
    telefono: "987654321",
    direccion: "Av. Siempre Viva 123",
    fecha_nacimiento: "1990-01-01",
    genero: "masculino",
    email: "juan@example.com",
    password: "Password123",
    dni: "12345678",
    rol: "cliente",
  };

  it("📌 Debería registrar un cliente", async () => {
    const res = await request(app).post("/usuarios/registro").send(clienteData);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("usuario.id");
    expect(res.body.usuario.email).toBe(clienteData.email);

    clienteId = res.body.usuario.id;
  });

  it("📌 Debería loguear al cliente y devolver token", async () => {
    const res = await request(app).post("/usuarios/login").send({
      email: clienteData.email,
      password: clienteData.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    tokenCliente = res.body.token;
  });

  it("📌 Debería acceder al perfil autenticado", async () => {
    const res = await request(app)
      .get("/usuarios/perfil")
      .set("Authorization", `Bearer ${tokenCliente}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(clienteData.email);
  });

  it("❌ No debería loguear con credenciales incorrectas", async () => {
    const res = await request(app).post("/usuarios/login").send({
      email: clienteData.email,
      password: "ClaveIncorrecta",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error");
  });
});
