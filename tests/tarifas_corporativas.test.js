const request = require("supertest");
const app = require("../app");
const {
  sequelize,
  Usuario,
  TarifaCorporativa,
  TipoTicket,
} = require("../models");

describe("💼 API de Tarifas Corporativas", () => {
  let tokenCorporativo;
  let tokenAdmin;
  let tarifaId;
  let corporativoId;
  let tipoTicketId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de TARIFAS CORPORATIVAS...");
    await sequelize.sync({ force: true });

    console.log("👑 Creando usuarios...");
    const admin = await Usuario.create({
      nombre: "Administrador",
      email: "admin@cine.com",
      password: "admin123",
      rol: "admin",
      estado: "activo",
    });

    const corporativo = await Usuario.create({
      nombre: "Empresa XYZ",
      ruc: "20123456789",
      representante: "María García",
      cargo: "Gerente RRHH",
      telefono: "987654321",
      direccion: "Av. Empresarial 456",
      email: "corporativo@test.com",
      password: "corporativo123",
      rol: "corporativo",
      estado: "activo",
    });
    corporativoId = corporativo.id;

    // Crear tipo de ticket
    const tipoTicket = await TipoTicket.create({
      nombre: "Adulto",
    });
    tipoTicketId = tipoTicket.id;

    console.log("✅ Datos de prueba creados");

    // Login admin
    const resAdmin = await request(app).post("/usuarios/login").send({
      email: "admin@cine.com",
      password: "admin123",
    });
    tokenAdmin = resAdmin.body.token;

    // Login corporativo
    const resCorporativo = await request(app).post("/usuarios/login").send({
      email: "corporativo@test.com",
      password: "corporativo123",
    });
    tokenCorporativo = resCorporativo.body.token;

    console.log("🟢 Tokens obtenidos\n");
  });

  afterAll(async () => {
    console.log("\n🔚 Cerrando conexión con base de datos...");
    await sequelize.close();
    console.log("✅ Conexión cerrada correctamente\n");
  });

  it("💼 Crear tarifa corporativa (admin o corporativo)", async () => {
    const res = await request(app)
      .post("/tarifas_corporativas")
      .set("Authorization", `Bearer ${tokenCorporativo}`)
      .send({
        id_cliente_corporativo: corporativoId,
        id_tipo_usuario: tipoTicketId,
        precio: 20.5,
      });

    console.log("📤 Respuesta al crear tarifa:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("tarifa");

    tarifaId = res.body.tarifa.id;
  });

  it("📜 Listar tarifas corporativas (corporativo ve solo las suyas)", async () => {
    const res = await request(app)
      .get("/tarifas_corporativas")
      .set("Authorization", `Bearer ${tokenCorporativo}`);

    console.log("📤 Tarifas listadas:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("🗑️ Eliminar tarifa corporativa (dueño o admin)", async () => {
    const res = await request(app)
      .delete(`/tarifas_corporativas/${tarifaId}`)
      .set("Authorization", `Bearer ${tokenCorporativo}`);

    console.log("📤 Tarifa eliminada:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/eliminada/i);
  });
});
