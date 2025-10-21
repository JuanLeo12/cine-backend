const request = require("supertest");
const app = require("../app");
const {
  sequelize,
  Usuario,
  OrdenCompra,
  OrdenTicket,
  TipoTicket,
  Funcion,
  Pelicula,
  Sala,
  Sede,
} = require("../models");

describe("🎟️ API de Órdenes de Tickets", () => {
  let tokenCliente;
  let ordenTicketId;
  let ordenCompraId;
  let tipoTicketId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de ÓRDENES DE TICKETS...");
    await sequelize.sync({ force: true });

    console.log("👑 Creando datos de prueba...");
    const cliente = await Usuario.create({
      nombre: "Cliente",
      apellido: "Test",
      dni: "87654321",
      telefono: "987654321",
      direccion: "Calle Test 789",
      fecha_nacimiento: "1995-05-15",
      genero: "femenino",
      email: "cliente@tickets.com",
      password: "cliente123",
      rol: "cliente",
      estado: "activo",
    });

    const tipoTicket = await TipoTicket.create({
      nombre: "Adulto",
    });
    tipoTicketId = tipoTicket.id;

    // Crear película, sede, sala, función
    const pelicula = await Pelicula.create({
      titulo: "Spider-Man",
      genero: "Acción",
      clasificacion: "PG-13",
      duracion: 120,
      fecha_estreno: "2023-06-01",
      sinopsis: "Aventuras del hombre araña",
      tipo: "cartelera",
      estado: "activa",
    });

    const sede = await Sede.create({
      nombre: "Sede Test",
      ciudad: "Lima",
      direccion: "Av. Test 111",
      telefono: "999111222",
      estado: "activa",
    });

    const sala = await Sala.create({
      nombre: "Sala 5",
      filas: 10,
      columnas: 10,
      id_sede: sede.id,
      estado: "activa",
    });

    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 3);

    const funcion = await Funcion.create({
      id_pelicula: pelicula.id,
      id_sala: sala.id,
      fecha: fechaFutura.toISOString().split("T")[0],
      hora: "19:00:00",
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

    const resCliente = await request(app).post("/usuarios/login").send({
      email: "cliente@tickets.com",
      password: "cliente123",
    });
    tokenCliente = resCliente.body.token;

    console.log("🟢 Token obtenido\n");
  });

  afterAll(async () => {
    console.log("\n🔚 Cerrando conexión con base de datos...");
    await sequelize.close();
    console.log("✅ Conexión cerrada correctamente\n");
  });

  it("🎟️ Crear orden de ticket (cliente)", async () => {
    const res = await request(app)
      .post("/ordenes_tickets")
      .set("Authorization", `Bearer ${tokenCliente}`)
      .send({
        id_orden_compra: ordenCompraId,
        id_tipo_usuario: tipoTicketId,
        cantidad: 2,
        precio_unitario: 22.0,
        descuento: 0,
      });

    console.log("📤 Respuesta al crear orden ticket:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("ticket");

    ordenTicketId = res.body.ticket.id;
  });

  it("📜 Listar órdenes de tickets", async () => {
    const res = await request(app)
      .get("/ordenes_tickets")
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("📤 Órdenes de tickets listadas:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("🗑️ Eliminar orden de ticket", async () => {
    const res = await request(app)
      .delete(`/ordenes_tickets/${ordenTicketId}`)
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("📤 Orden ticket eliminada:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/eliminado/i);
  });
});
