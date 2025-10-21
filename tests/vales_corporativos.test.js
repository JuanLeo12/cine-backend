const request = require("supertest");
const app = require("../app");
const {
  sequelize,
  Usuario,
  ValeCorporativo,
  OrdenCompra,
  Pago,
  MetodoPago,
  Funcion,
  Pelicula,
  Sala,
  Sede,
} = require("../models");

describe("🎟️ API de Vales Corporativos", () => {
  let tokenCorporativo;
  let tokenAdmin;
  let valeId;
  let pagoId;
  let ordenCompraId;
  let corporativoId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de VALES CORPORATIVOS...");
    await sequelize.sync({ force: true });

    console.log("👑 Creando datos de prueba...");
    const admin = await Usuario.create({
      nombre: "Administrador",
      email: "admin@cine.com",
      password: "admin123",
      rol: "admin",
      estado: "activo",
    });

    const corporativo = await Usuario.create({
      nombre: "Corporación Vales",
      ruc: "20555666777",
      representante: "Roberto Martínez",
      cargo: "Director de Operaciones",
      telefono: "922333444",
      direccion: "Av. Vales 888",
      email: "vales@corporacion.com",
      password: "corporativo123",
      rol: "corporativo",
      estado: "activo",
    });
    corporativoId = corporativo.id;

    const metodoPago = await MetodoPago.create({
      nombre: "Transferencia Bancaria",
      tipo: "transferencia",
      estado: "activo",
    });

    // Crear película, sede, sala, función
    const pelicula = await Pelicula.create({
      titulo: "Interstellar",
      genero: "Ciencia ficción",
      clasificacion: "PG-13",
      duracion: 169,
      fecha_estreno: "2014-11-07",
      sinopsis: "Viaje interestelar para salvar la humanidad",
      tipo: "cartelera",
      estado: "activa",
    });

    const sede = await Sede.create({
      nombre: "Sede Corporativa",
      ciudad: "Lima",
      direccion: "Av. Corporativa 555",
      telefono: "911222333",
      estado: "activa",
    });

    const sala = await Sala.create({
      nombre: "Sala Corporativa",
      filas: 18,
      columnas: 22,
      id_sede: sede.id,
      estado: "activa",
    });

    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 15);

    const funcion = await Funcion.create({
      id_pelicula: pelicula.id,
      id_sala: sala.id,
      fecha: fechaFutura.toISOString().split("T")[0],
      hora: "18:00:00",
      estado: "activa",
      es_privada: true,
    });

    const ordenCompra = await OrdenCompra.create({
      id_usuario: corporativoId,
      id_funcion: funcion.id,
      fecha_compra: new Date(),
      estado: "pagada",
    });
    ordenCompraId = ordenCompra.id;

    const pago = await Pago.create({
      id_orden_compra: ordenCompra.id,
      id_metodo_pago: metodoPago.id,
      monto_total: 320.0,
      estado_pago: "confirmado",
      fecha_pago: new Date(),
    });
    pagoId = pago.id;

    console.log("✅ Datos de prueba creados");

    const resAdmin = await request(app).post("/usuarios/login").send({
      email: "admin@cine.com",
      password: "admin123",
    });
    tokenAdmin = resAdmin.body.token;

    const resCorporativo = await request(app).post("/usuarios/login").send({
      email: "vales@corporacion.com",
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

  it("🎟️ Crear vale corporativo (corporativo)", async () => {
    const res = await request(app)
      .post("/vales_corporativos")
      .set("Authorization", `Bearer ${tokenCorporativo}`)
      .send({
        id_pago: pagoId,
        id_orden_compra: ordenCompraId,
        codigo_vale: "VALE2024-001",
        cantidad_tickets: 10,
        fecha_emision: new Date().toISOString().split("T")[0],
        fecha_vencimiento: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });

    console.log("📤 Respuesta al crear vale:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("vale");

    valeId = res.body.vale.id;
  });

  it("📜 Listar vales corporativos (corporativo ve solo los suyos)", async () => {
    const res = await request(app)
      .get("/vales_corporativos")
      .set("Authorization", `Bearer ${tokenCorporativo}`);

    console.log("📤 Vales listados:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("🔍 Obtener vale por ID", async () => {
    const res = await request(app)
      .get(`/vales_corporativos/${valeId}`)
      .set("Authorization", `Bearer ${tokenCorporativo}`);

    console.log("📤 Vale obtenido:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", valeId);
  });

  it("✏️ Actualizar vale corporativo (corporativo dueño)", async () => {
    const res = await request(app)
      .put(`/vales_corporativos/${valeId}`)
      .set("Authorization", `Bearer ${tokenCorporativo}`)
      .send({
        estado: "usado",
      });

    console.log("📤 Vale actualizado:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.vale.estado).toBe("usado");
  });
});
