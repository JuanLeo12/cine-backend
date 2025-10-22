const request = require("supertest");
const app = require("../app");
const { sequelize, Usuario, MetodoPago } = require("../models");

describe("💳 API de Métodos de Pago", () => {
  let tokenAdmin;
  let metodoPagoId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de MÉTODOS DE PAGO...");
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

  it("💳 Crear método de pago (solo admin)", async () => {
    const res = await request(app)
      .post("/metodos_pago")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Tarjeta de Crédito",
        tipo: "tarjeta",
      });

    console.log("📤 Respuesta al crear método de pago:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("metodo");
    expect(res.body.metodo.nombre).toBe("Tarjeta de Crédito");

    metodoPagoId = res.body.metodo.id;
  });

  it("📜 Listar métodos de pago activos (público)", async () => {
    const res = await request(app).get("/metodos_pago");
    console.log("📤 Métodos de pago listados:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("🔍 Obtener método de pago por ID (público)", async () => {
    const res = await request(app).get(`/metodos_pago/${metodoPagoId}`);
    console.log("📤 Método de pago obtenido:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", metodoPagoId);
  });

  it("✏️ Actualizar método de pago (solo admin)", async () => {
    const res = await request(app)
      .put(`/metodos_pago/${metodoPagoId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Visa Mastercard",
      });

    console.log("📤 Método de pago actualizado:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.metodo.nombre).toBe("Visa Mastercard");
  });

  it("🗑️ Eliminar método de pago (solo admin)", async () => {
    const res = await request(app)
      .delete(`/metodos_pago/${metodoPagoId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    console.log("📤 Método de pago eliminado:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/eliminado|inactivado/i);
  });
});
