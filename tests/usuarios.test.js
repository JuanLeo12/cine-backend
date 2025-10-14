// tests/usuarios.test.js
const request = require("supertest");
const app = require("../app");
const sequelize = require("../config/db");
const { Usuario } = require("../models");

beforeAll(async () => {
  console.log("\n🧩 Iniciando entorno de pruebas de usuarios...");

  // Aseguramos DB limpia para tests (si ya lo haces en jest.setup.js, no hace daño)
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  console.log("🗑️ Base de datos de test sincronizada (force: true).");

  // Crear admin directo (evita la restricción al registrar admin vía endpoint)
  const admin = await Usuario.create({
    nombre: "Admin",
    apellido: "Test",
    email: "admin@test.local",
    password: "AdminPass123", // hook beforeCreate lo hashea
    rol: "admin",
  });
  console.log("👑 Admin creado:", admin.email);
});

afterAll(async () => {
  await sequelize.close();
  console.log("\n✅ Conexión cerrada. Fin de pruebas de usuarios.\n");
});

describe("🧪 Usuarios API - flujo completo (registro, login, perfil, update, delete)", () => {
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

  it("📌 (1) Login del admin y obtención de token", async () => {
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

    console.log(
      "⬅️ Listado recibido:",
      res.statusCode,
      "cantidad:",
      res.body.length
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2); // admin + cliente
  });

  it("🚫 (7) Cliente no puede listar usuarios (403)", async () => {
    console.log("\n➡️ Intentando listar usuarios con token cliente...");
    const res = await request(app)
      .get("/usuarios")
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log(
      "⬅️ Respuesta (cliente intenta listar):",
      res.statusCode,
      res.body
    );
    expect(res.statusCode).toBe(403);
  });

  // ----- CASOS ADICIONALES: update y delete -----

  it("🔧 (8) Cliente (dueño) actualiza su teléfono", async () => {
    console.log("\n➡️ Cliente actualiza su teléfono...");
    const nuevoTelefono = "999111222";

    const res = await request(app)
      .put(`/usuarios/${clienteId}`)
      .set("Authorization", `Bearer ${tokenCliente}`)
      .send({ telefono: nuevoTelefono });

    console.log("⬅️ Respuesta update (dueño):", res.statusCode, res.body);
    expect(res.statusCode).toBe(200);
    // controlador devuelve { mensaje, usuario }
    expect(res.body.usuario).toBeDefined();
    expect(res.body.usuario.telefono).toBe(nuevoTelefono);
  });

  it("🔧 (9) Admin puede cambiar el rol del usuario", async () => {
    console.log("\n➡️ Admin cambia el rol del cliente a 'corporativo'...");
    const res = await request(app)
      .put(`/usuarios/${clienteId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ rol: "corporativo" });

    console.log(
      "⬅️ Respuesta update (admin cambia rol):",
      res.statusCode,
      res.body
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.usuario).toBeDefined();
    expect(res.body.usuario.rol).toBe("corporativo");
  });

  it("🗑️ (10) Cliente (dueño) elimina su cuenta (soft delete)", async () => {
    console.log("\n➡️ Cliente (dueño) solicita eliminación de su cuenta...");
    const res = await request(app)
      .delete(`/usuarios/${clienteId}`)
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("⬅️ Respuesta delete:", res.statusCode, res.body);
    expect(res.statusCode).toBe(200);

    // Verificar en BD que quedó inactivo
    const usuarioBD = await Usuario.findByPk(clienteId, { paranoid: false });
    expect(usuarioBD).toBeDefined();
    expect(usuarioBD.estado).toBe("inactivo");
  });
});
