const request = require("supertest");
const app = require("../app");
const sequelize = require("../config/db");
const { Usuario } = require("../models");

beforeAll(async () => {
  console.log("\n🧩 Iniciando entorno de pruebas de usuarios...");

  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  console.log("🗑️ Base de datos limpia y sincronizada.");

  // Crear admin directo (para probar endpoints protegidos)
  const admin = await Usuario.create({
    nombre: "Admin",
    apellido: "Test",
    email: "admin@test.local",
    password: "AdminPass123",
    rol: "admin",
  });
  console.log("👑 Admin creado:", admin.email);
});

afterAll(async () => {
  await sequelize.close();
  console.log("\n✅ Conexión cerrada. Fin de pruebas de usuarios.\n");
});

describe("🧪 Usuarios API - flujo completo", () => {
  let tokenCliente = null;
  let tokenAdmin = null;
  let clienteId = null;

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

  it("📌 (1) Login del admin para obtener token", async () => {
    console.log("\n➡️ Intentando login de admin...");
    const res = await request(app).post("/usuarios/login").send({
      email: "admin@test.local",
      password: "AdminPass123",
    });

    console.log("⬅️ Respuesta login admin:", res.statusCode, res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");

    tokenAdmin = res.body.token;
  });

  it("📌 (2) Registrar nuevo cliente (endpoint público)", async () => {
    console.log("\n➡️ Registrando cliente:", clienteData.email);
    const res = await request(app).post("/usuarios/registro").send(clienteData);

    console.log("⬅️ Respuesta registro cliente:", res.statusCode, res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("usuario.id");
    expect(res.body.usuario.email).toBe(clienteData.email);

    clienteId = res.body.usuario.id;
  });

  it("📌 (3) Login del cliente y obtención de token", async () => {
    console.log("\n➡️ Intentando login del cliente:", clienteData.email);
    const res = await request(app).post("/usuarios/login").send({
      email: clienteData.email,
      password: clienteData.password,
    });

    console.log("⬅️ Respuesta login cliente:", res.statusCode, res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");

    tokenCliente = res.body.token;
  });

  it("📌 (4) Acceso al perfil autenticado del cliente", async () => {
    console.log("\n➡️ Solicitando perfil del cliente...");
    const res = await request(app)
      .get("/usuarios/perfil")
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("⬅️ Perfil recibido:", res.statusCode, res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(clienteData.email);
  });

  it("❌ (5) Login con credenciales incorrectas", async () => {
    console.log("\n➡️ Intentando login con clave incorrecta...");
    const res = await request(app).post("/usuarios/login").send({
      email: clienteData.email,
      password: "ClaveIncorrecta",
    });

    console.log("⬅️ Respuesta login erróneo:", res.statusCode, res.body);
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("📌 (6) Listado de usuarios por admin", async () => {
    console.log("\n➡️ Solicitando listado de usuarios (admin)...");
    const res = await request(app)
      .get("/usuarios")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    console.log("⬅️ Listado recibido:", res.statusCode, res.body.length, "usuarios");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2); // admin + cliente
  });

  it("🚫 (7) Cliente no puede listar usuarios", async () => {
    console.log("\n➡️ Intentando listar usuarios con token cliente...");
    const res = await request(app)
      .get("/usuarios")
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("⬅️ Respuesta:", res.statusCode, res.body);
    expect(res.statusCode).toBe(403);
  });
});
