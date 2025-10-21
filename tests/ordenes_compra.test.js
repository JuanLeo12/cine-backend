const request = require("supertest");
const app = require("../app");
const {
  sequelize,
  Usuario,
  Funcion,
  Pelicula,
  Sala,
  Sede,
  OrdenCompra,
} = require("../models");

describe("🛒 API de Órdenes de Compra", () => {
  let tokenCliente;
  let tokenAdmin;
  let ordenId;
  let funcionId;
  let clienteId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de ÓRDENES DE COMPRA...");
    await sequelize.sync({ force: true });

    console.log("👑 Creando usuarios...");
    const admin = await Usuario.create({
      nombre: "Administrador",
      email: "admin@cine.com",
      password: "admin123",
      rol: "admin",
      estado: "activo",
    });

    const cliente = await Usuario.create({
      nombre: "Cliente",
      apellido: "Test",
      dni: "12345678",
      telefono: "987654321",
      direccion: "Calle Test 123",
      fecha_nacimiento: "1990-01-01",
      genero: "masculino",
      email: "cliente@test.com",
      password: "cliente123",
      rol: "cliente",
      estado: "activo",
    });
    clienteId = cliente.id;

    // Crear película, sede, sala y función
    const pelicula = await Pelicula.create({
      titulo: "Avengers",
      genero: "Acción",
      clasificacion: "PG-13",
      duracion: 142,
      fecha_estreno: "2012-05-04",
      sinopsis: "Superhéroes se unen para salvar el mundo",
      tipo: "cartelera",
      estado: "activa",
    });

    const sede = await Sede.create({
      nombre: "Sede Sur",
      ciudad: "Lima",
      direccion: "Av. Sur 789",
      telefono: "999000111",
      estado: "activa",
    });

    const sala = await Sala.create({
      nombre: "Sala IMAX",
      filas: 15,
      columnas: 20,
      id_sede: sede.id,
      estado: "activa",
    });

    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 5);

    const funcion = await Funcion.create({
      id_pelicula: pelicula.id,
      id_sala: sala.id,
      fecha: fechaFutura.toISOString().split("T")[0],
      hora: "20:30:00",
      estado: "activa",
    });
    funcionId = funcion.id;

    console.log("✅ Datos de prueba creados");

    // Login admin
    const resAdmin = await request(app).post("/usuarios/login").send({
      email: "admin@cine.com",
      password: "admin123",
    });
    tokenAdmin = resAdmin.body.token;

    // Login cliente
    const resCliente = await request(app).post("/usuarios/login").send({
      email: "cliente@test.com",
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

  it("🛒 Crear orden de compra (cliente autenticado)", async () => {
    const res = await request(app)
      .post("/ordenes_compra")
      .set("Authorization", `Bearer ${tokenCliente}`)
      .send({
        id_funcion: funcionId,
      });

    console.log("📤 Respuesta al crear orden:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("orden");
    expect(res.body.orden.id_usuario).toBe(clienteId);

    ordenId = res.body.orden.id;
  });

  it("📜 Listar órdenes del cliente autenticado", async () => {
    const res = await request(app)
      .get("/ordenes_compra")
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("📤 Órdenes listadas:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("🔍 Obtener orden por ID (dueño o admin)", async () => {
    const res = await request(app)
      .get(`/ordenes_compra/${ordenId}`)
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("📤 Orden obtenida:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", ordenId);
  });

  it("🗑️ Cancelar orden (cliente dueño)", async () => {
    const res = await request(app)
      .delete(`/ordenes_compra/${ordenId}`)
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("📤 Orden cancelada:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/cancelada/i);
  });
});
