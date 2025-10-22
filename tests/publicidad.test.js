const request = require("supertest");
const app = require("../app");
const {
  sequelize,
  Usuario,
  Sede,
  Publicidad,
} = require("../models");

describe("📢 API de Publicidad", () => {
  let tokenCorporativo;
  let tokenAdmin;
  let publicidadId;
  let sedeId;
  let corporativoId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de PUBLICIDAD...");
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
      nombre: "Empresa Marketing",
      ruc: "20111222333",
      representante: "Laura Fernández",
      cargo: "Jefa de Marketing",
      telefono: "955666777",
      direccion: "Av. Marketing 789",
      email: "marketing@empresa.com",
      password: "corporativo123",
      rol: "corporativo",
      estado: "activo",
    });
    corporativoId = corporativo.id;

    // Crear sede
    const sede = await Sede.create({
      nombre: "Sede Centro",
      ciudad: "Lima",
      direccion: "Av. Centro 456",
      telefono: "988777666",
    });
    sedeId = sede.id;

    console.log("✅ Datos de prueba creados");

    // Login admin
    const resAdmin = await request(app).post("/usuarios/login").send({
      email: "admin@cine.com",
      password: "admin123",
    });
    tokenAdmin = resAdmin.body.token;

    // Login corporativo
    const resCorporativo = await request(app).post("/usuarios/login").send({
      email: "marketing@empresa.com",
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

  it("📢 Solicitar publicidad (corporativo)", async () => {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() + 7);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 30);

    const res = await request(app)
      .post("/publicidad")
      .set("Authorization", `Bearer ${tokenCorporativo}`)
      .send({
        cliente: "Empresa Corporativa XYZ",
        id_sede: sedeId,
        tipo: "banner",
        descripcion: "Campaña publicitaria de nuevo producto",
        fecha_inicio: fechaInicio.toISOString().split("T")[0],
        fecha_fin: fechaFin.toISOString().split("T")[0],
        imagen_url: "https://example.com/banner.jpg",
        precio: 2500.0,
      });

    console.log("📤 Respuesta al crear publicidad:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("publicidad");

    publicidadId = res.body.publicidad.id;
  });

  it("📜 Listar publicidades (corporativo ve solo las suyas)", async () => {
    const res = await request(app)
      .get("/publicidad")
      .set("Authorization", `Bearer ${tokenCorporativo}`);

    console.log("📤 Publicidades listadas:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("🔍 Obtener publicidad por ID", async () => {
    const res = await request(app)
      .get(`/publicidad/${publicidadId}`)
      .set("Authorization", `Bearer ${tokenCorporativo}`);

    console.log("📤 Publicidad obtenida:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", publicidadId);
  });

  it("🗑️ Cancelar publicidad (dueño o admin)", async () => {
    const res = await request(app)
      .delete(`/publicidad/${publicidadId}`)
      .set("Authorization", `Bearer ${tokenCorporativo}`);

    console.log("📤 Publicidad cancelada:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/cancelada|eliminada/i);
  });
});
