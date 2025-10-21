const request = require("supertest");
const app = require("../app");
const {
  sequelize,
  Usuario,
  OrdenCompra,
  Pago,
  MetodoPago,
  Funcion,
  Pelicula,
  Sala,
  Sede,
} = require("../models");

describe("💰 API de Pagos", () => {
  let tokenCliente;
  let tokenAdmin;
  let pagoId;
  let ordenCompraId;
  let metodoPagoId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de PAGOS...");
    await sequelize.sync({ force: true });

    console.log("👑 Creando datos de prueba...");
    const admin = await Usuario.create({
      nombre: "Administrador",
      email: "admin@cine.com",
      password: "admin123",
      rol: "admin",
      estado: "activo",
    });

    const cliente = await Usuario.create({
      nombre: "Cliente",
      apellido: "Pago",
      dni: "55667788",
      telefono: "977888999",
      direccion: "Calle Pagos 456",
      fecha_nacimiento: "1988-08-08",
      genero: "femenino",
      email: "cliente@pagos.com",
      password: "cliente123",
      rol: "cliente",
      estado: "activo",
    });

    const metodoPago = await MetodoPago.create({
      nombre: "Tarjeta Visa",
      tipo: "tarjeta",
      estado: "activo",
    });
    metodoPagoId = metodoPago.id;

    // Crear película, sede, sala, función
    const pelicula = await Pelicula.create({
      titulo: "Titanic",
      genero: "Drama",
      clasificacion: "PG-13",
      duracion: 195,
      fecha_estreno: "1997-12-19",
      sinopsis: "Historia de amor en el Titanic",
      tipo: "cartelera",
      estado: "activa",
    });

    const sede = await Sede.create({
      nombre: "Sede Este",
      ciudad: "Lima",
      direccion: "Av. Este 333",
      telefono: "999444555",
      estado: "activa",
    });

    const sala = await Sala.create({
      nombre: "Sala VIP",
      filas: 8,
      columnas: 10,
      id_sede: sede.id,
      estado: "activa",
    });

    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 6);

    const funcion = await Funcion.create({
      id_pelicula: pelicula.id,
      id_sala: sala.id,
      fecha: fechaFutura.toISOString().split("T")[0],
      hora: "21:00:00",
      estado: "activa",
    });

    const ordenCompra = await OrdenCompra.create({
      id_usuario: cliente.id,
      id_funcion: funcion.id,
      fecha_compra: new Date(),
      estado: "pendiente",
    });
    ordenCompraId = ordenCompra.id;

    console.log("✅ Datos de prueba creados");

    const resAdmin = await request(app).post("/usuarios/login").send({
      email: "admin@cine.com",
      password: "admin123",
    });
    tokenAdmin = resAdmin.body.token;

    const resCliente = await request(app).post("/usuarios/login").send({
      email: "cliente@pagos.com",
      password: "cliente123",
    });
    tokenCliente = resCliente.body.token;

    console.log("🟢 Tokens obtenidos\n");
  });

  afterAll(async () => {
    console.log("\n🔚 Cerrando conexión con base de datos...");
    await sequelize.close();
    console.log("✅ Conexión cerrada correctamente\n");
  });

  it("💰 Crear pago (cliente)", async () => {
    const res = await request(app)
      .post("/pagos")
      .set("Authorization", `Bearer ${tokenCliente}`)
      .send({
        id_orden_compra: ordenCompraId,
        id_metodo_pago: metodoPagoId,
        monto_total: 70.0,
      });

    console.log("📤 Respuesta al crear pago:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("pago");

    pagoId = res.body.pago.id;
  });

  it("📜 Listar pagos (cliente ve solo los suyos)", async () => {
    const res = await request(app)
      .get("/pagos")
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("📤 Pagos listados:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("🔍 Obtener pago por ID", async () => {
    const res = await request(app)
      .get(`/pagos/${pagoId}`)
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("📤 Pago obtenido:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", pagoId);
  });
});
