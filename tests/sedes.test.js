const request = require("supertest");
const app = require("../app");
const { sequelize, Usuario, Sede } = require("../models");

describe("🏢 API de Sedes", () => {
  let tokenAdmin;
  let sedeId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de SEDES...");
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

    console.log("🔐 Iniciando sesión con admin...");
    const resLogin = await request(app).post("/usuarios/login").send({
      email: "admin@cine.com",
      password: "admin123",
    });

    console.log("📤 Respuesta del login:", resLogin.body);
    expect(resLogin.statusCode).toBe(200);
    tokenAdmin = resLogin.body.token;
    console.log("🟢 Token obtenido correctamente\n");
  });

  afterAll(async () => {
    console.log("\n🔚 Cerrando conexión con base de datos...");
    await sequelize.close();
    console.log("✅ Conexión cerrada correctamente\n");
  });

  it("🏢 Crear sede (solo admin)", async () => {
    const res = await request(app)
      .post("/sedes")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Sede Central",
        ciudad: "Lima",
        direccion: "Av. Principal 123",
        telefono: "999888777",
      });

    console.log("📤 Respuesta al crear sede:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("sede");
    expect(res.body.sede.nombre).toBe("Sede Central");

    sedeId = res.body.sede.id;
  });

  it("📜 Listar sedes activas (público)", async () => {
    const res = await request(app).get("/sedes");
    console.log("📤 Sedes listadas:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("🔍 Obtener sede por ID (público)", async () => {
    const res = await request(app).get(`/sedes/${sedeId}`);
    console.log("📤 Sede obtenida:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", sedeId);
    expect(res.body.nombre).toBe("Sede Central");
  });

  it("✏️ Actualizar sede (solo admin)", async () => {
    const res = await request(app)
      .put(`/sedes/${sedeId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Sede Central Actualizada",
        telefono: "987654321",
      });

    console.log("📤 Sede actualizada:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.sede.nombre).toBe("Sede Central Actualizada");
  });

  it("🗑️ Eliminar sede (soft delete, solo admin)", async () => {
    const res = await request(app)
      .delete(`/sedes/${sedeId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    console.log("📤 Sede eliminada:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/inactivada|eliminada/i);
  });

  it("🚫 Verificar que sede inactiva no aparece en listado", async () => {
    const res = await request(app).get("/sedes");
    console.log("📤 Listado tras eliminación:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.find((s) => s.id === sedeId)).toBeUndefined();
  });
});
