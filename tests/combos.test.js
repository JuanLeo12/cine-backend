const request = require("supertest");
const app = require("../app");
const { sequelize, Usuario, Combo } = require("../models");

describe("🍿 API de Combos", () => {
  let tokenAdmin;
  let comboId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de COMBOS...");
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

    expect(resLogin.statusCode).toBe(200);
    tokenAdmin = resLogin.body.token;
    console.log("🟢 Token obtenido correctamente\n");
  });

  afterAll(async () => {
    console.log("\n🔚 Cerrando conexión con base de datos...");
    await sequelize.close();
    console.log("✅ Conexión cerrada correctamente\n");
  });

  it("🍿 Crear combo (solo admin)", async () => {
    const res = await request(app)
      .post("/combos")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Combo Familiar",
        descripcion: "2 bebidas grandes + 1 canchita gigante",
        precio: 35.5,
      });

    console.log("📤 Respuesta al crear combo:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("combo");
    expect(res.body.combo.nombre).toBe("Combo Familiar");

    comboId = res.body.combo.id;
  });

  it("📜 Listar combos activos (público)", async () => {
    const res = await request(app).get("/combos");
    console.log("📤 Combos listados:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("🔍 Obtener combo por ID (público)", async () => {
    const res = await request(app).get(`/combos/${comboId}`);
    console.log("📤 Combo obtenido:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", comboId);
    expect(res.body.nombre).toBe("Combo Familiar");
  });

  it("✏️ Actualizar combo (solo admin)", async () => {
    const res = await request(app)
      .put(`/combos/${comboId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Combo Familiar Actualizado",
        precio: 39.9,
      });

    console.log("📤 Combo actualizado:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.combo.nombre).toBe("Combo Familiar Actualizado");
  });

  it("🗑️ Eliminar combo (soft delete, solo admin)", async () => {
    const res = await request(app)
      .delete(`/combos/${comboId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    console.log("📤 Combo eliminado:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/eliminado|inactivado/i);
  });

  it("🚫 Verificar que combo inactivo no aparece en listado", async () => {
    const res = await request(app).get("/combos");
    console.log("📤 Listado tras eliminación:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.find((c) => c.id === comboId)).toBeUndefined();
  });
});
