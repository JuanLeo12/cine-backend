const request = require("supertest");
const app = require("../app");
const {
  sequelize,
  Usuario,
  Sala,
  Sede,
  AlquilerSala,
  Pago,
  MetodoPago,
} = require("../models");

describe("🏛️ API de Alquiler de Salas", () => {
  let tokenCorporativo;
  let tokenAdmin;
  let alquilerId;
  let salaId;
  let corporativoId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de ALQUILER DE SALAS...");
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
      nombre: "Corporación ABC",
      ruc: "20987654321",
      representante: "Pedro Sánchez",
      cargo: "Director de Eventos",
      telefono: "999888777",
      direccion: "Av. Corporate 123",
      email: "corporativo@abc.com",
      password: "corporativo123",
      rol: "corporativo",
      estado: "activo",
    });
    corporativoId = corporativo.id;

    // Crear sede y sala
    const sede = await Sede.create({
      nombre: "Sede Principal",
      ciudad: "Lima",
      direccion: "Av. Principal 100",
      telefono: "987123456",
      estado: "activa",
    });

    const sala = await Sala.create({
      nombre: "Sala Auditorio",
      filas: 20,
      columnas: 25,
      id_sede: sede.id,
      estado: "activa",
    });
    salaId = sala.id;

    console.log("✅ Datos de prueba creados");

    // Login admin
    const resAdmin = await request(app).post("/usuarios/login").send({
      email: "admin@cine.com",
      password: "admin123",
    });
    tokenAdmin = resAdmin.body.token;

    // Login corporativo
    const resCorporativo = await request(app).post("/usuarios/login").send({
      email: "corporativo@abc.com",
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

  it("🏛️ Crear alquiler de sala (corporativo o admin)", async () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 10);

    const res = await request(app)
      .post("/alquileres")
      .set("Authorization", `Bearer ${tokenCorporativo}`)
      .send({
        id_sala: salaId,
        fecha: fecha.toISOString().split("T")[0],
        hora_inicio: "09:00",
        hora_fin: "12:00",
        descripcion_evento: "Conferencia anual de la empresa",
        precio: 1500.0,
      });

    console.log("📤 Respuesta al crear alquiler:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("alquiler");

    alquilerId = res.body.alquiler.id;
  });

  it("📜 Listar alquileres (corporativo ve solo los suyos)", async () => {
    const res = await request(app)
      .get("/alquileres")
      .set("Authorization", `Bearer ${tokenCorporativo}`);

    console.log("📤 Alquileres listados:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("🔍 Obtener alquiler por ID", async () => {
    const res = await request(app)
      .get(`/alquileres/${alquilerId}`)
      .set("Authorization", `Bearer ${tokenCorporativo}`);

    console.log("📤 Alquiler obtenido:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", alquilerId);
  });

  it("🗑️ Cancelar alquiler (dueño o admin)", async () => {
    const res = await request(app)
      .delete(`/alquileres/${alquilerId}`)
      .set("Authorization", `Bearer ${tokenCorporativo}`);

    console.log("📤 Alquiler cancelado:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/eliminado/i);
  });
});
