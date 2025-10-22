const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../app");
const { sequelize, Usuario, Sala, Sede } = require("../models");

describe("🏟️ API de Salas", () => {
  let tokenAdmin;
  let salaId;
  let sedeId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de SALAS...");
    await sequelize.sync({ force: true });

    console.log("👑 Creando usuario admin base...");
    const admin = await Usuario.create({
      nombre: "Administrador",
      email: "admin@cine.com",
      password: "admin123",
      rol: "admin",
      estado: "activo",
    });

    console.log("✅ Admin creado:", admin.email);

    console.log("🏢 Creando sede base...");
    const sede = await Sede.create({
      nombre: "Sede Central",
      ciudad: "Lima",
      direccion: "Av. Principal 123",
      telefono: "999888777",
    });

    sedeId = sede.id;
    console.log("✅ Sede creada:", sede.nombre);

    console.log("🔐 Iniciando sesión con admin...");
    const resLogin = await request(app).post("/usuarios/login").send({
      email: "admin@cine.com",
      password: "admin123",
    });

    console.log("📤 Respuesta del login:", resLogin.body);
    expect(resLogin.statusCode).toBe(200);
    expect(resLogin.body).toHaveProperty("token");

    tokenAdmin = resLogin.body.token;
    console.log("🟢 Token obtenido correctamente\n");
  });

  afterAll(async () => {
    console.log("\n🔚 Cerrando conexión con base de datos...");
    await sequelize.close();
    console.log("✅ Conexión cerrada correctamente\n");
  });

  // -------------------- TESTS --------------------

  it("🏟️ Crear sala (solo admin)", async () => {
    const res = await request(app)
      .post("/salas")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Sala 1",
        filas: 10,
        columnas: 15,
        id_sede: sedeId,
      });

    console.log("📤 Respuesta al crear sala:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("sala");
    expect(res.body.sala.nombre).toBe("Sala 1");

    salaId = res.body.sala.id;
  });

  it("📜 Listar salas activas (público)", async () => {
    const res = await request(app).get("/salas");
    console.log("📤 Salas listadas:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("🔍 Obtener sala por ID (público)", async () => {
    const res = await request(app).get(`/salas/${salaId}`);
    console.log("📤 Sala obtenida:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", salaId);
  });

  it("✏️ Actualizar sala (solo admin)", async () => {
    const res = await request(app)
      .patch(`/salas/${salaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Sala 1 Actualizada",
        filas: 12,
        columnas: 18,
        id_sede: sedeId,
      });

    console.log("📤 Sala actualizada:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.sala.nombre).toBe("Sala 1 Actualizada");
  });

  it("🗑️ Eliminar sala (soft delete, solo admin)", async () => {
    const res = await request(app)
      .delete(`/salas/${salaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    console.log("📤 Sala eliminada:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/inactivada/i);
  });

  it("🚫 Verificar que sala inactiva no aparece en listado", async () => {
    const res = await request(app).get("/salas");
    console.log("📤 Listado tras eliminación:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.find((s) => s.id === salaId)).toBeUndefined();
  });
});
