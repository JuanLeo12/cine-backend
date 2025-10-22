const request = require("supertest");
const app = require("../app");
const {
  sequelize,
  Usuario,
  Ticket,
  OrdenTicket,
  OrdenCompra,
  AsientoFuncion,
  Funcion,
  Pelicula,
  Sala,
  Sede,
  TipoTicket,
} = require("../models");

describe("🎫 API de Tickets", () => {
  let tokenCliente;
  let tokenAdmin;
  let ticketId;
  let ordenTicketId;
  let asientoId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de TICKETS...");
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
      apellido: "Tickets",
      dni: "77665544",
      telefono: "933222111",
      direccion: "Calle Tickets 321",
      fecha_nacimiento: "1994-04-14",
      genero: "femenino",
      email: "cliente@tickets.com",
      password: "cliente123",
      rol: "cliente",
      estado: "activo",
    });

    const tipoTicket = await TipoTicket.create({
      nombre: "Adulto",
    });

    // Crear película, sede, sala, función
    const pelicula = await Pelicula.create({
      titulo: "The Dark Knight",
      genero: "Acción",
      clasificacion: "PG-13",
      duracion: 152,
      fecha_estreno: "2008-07-18",
      sinopsis: "Batman enfrenta al Joker",
      tipo: "cartelera",
      estado: "activa",
    });

    const sede = await Sede.create({
      nombre: "Sede Premium",
      ciudad: "Lima",
      direccion: "Av. Premium 777",
      telefono: "955444333",
    });

    const sala = await Sala.create({
      nombre: "Sala Batman",
      filas: 15,
      columnas: 18,
      id_sede: sede.id,
      estado: "activa",
    });

    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 8);

    const funcion = await Funcion.create({
      id_pelicula: pelicula.id,
      id_sala: sala.id,
      fecha: fechaFutura.toISOString().split("T")[0],
      hora: "19:30:00",
      estado: "activa",
    });

    const ordenCompra = await OrdenCompra.create({
      id_usuario: cliente.id,
      id_funcion: funcion.id,
      fecha_compra: new Date(),
      estado: "pagada",
    });

    const ordenTicket = await OrdenTicket.create({
      id_orden_compra: ordenCompra.id,
      id_tipo_usuario: tipoTicket.id,
      cantidad: 1,
      precio_unitario: 30.0,
      descuento: 0,
    });
    ordenTicketId = ordenTicket.id;

    const asiento = await AsientoFuncion.create({
      id_funcion: funcion.id,
      fila: "B",
      numero: 8,
      estado: "libre",
    });
    asientoId = asiento.id;

    console.log("✅ Datos de prueba creados");

    const resAdmin = await request(app).post("/usuarios/login").send({
      email: "admin@cine.com",
      password: "admin123",
    });
    tokenAdmin = resAdmin.body.token;

    const resCliente = await request(app).post("/usuarios/login").send({
      email: "cliente@tickets.com",
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

  it("🎫 Crear ticket (después de pagar)", async () => {
    const res = await request(app)
      .post("/tickets")
      .set("Authorization", `Bearer ${tokenCliente}`)
      .send({
        id_orden_ticket: ordenTicketId,
        id_asiento: asientoId,
        codigo_qr: "QR123456789",
      });

    console.log("📤 Respuesta al crear ticket:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("ticket");

    ticketId = res.body.ticket.id;
  });

  it("📜 Listar tickets del cliente", async () => {
    const res = await request(app)
      .get("/tickets")
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("📤 Tickets listados:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("🔍 Obtener ticket por ID", async () => {
    const res = await request(app)
      .get(`/tickets/${ticketId}`)
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("📤 Ticket obtenido:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", ticketId);
  });

  it("✅ Validar ticket (admin)", async () => {
    const res = await request(app)
      .patch(`/tickets/${ticketId}/validar`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    console.log("📤 Ticket validado:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/validado|usado/i);
  });
});
