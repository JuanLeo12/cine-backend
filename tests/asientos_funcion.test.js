const request = require("supertest");
const app = require("../app");
const {
  sequelize,
  Usuario,
  Funcion,
  AsientoFuncion,
  Pelicula,
  Sala,
  Sede,
} = require("../models");

describe("💺 API de Asientos de Función", () => {
  let tokenCliente;
  let asientoId;
  let funcionId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de ASIENTOS...");
    await sequelize.sync({ force: true });

    console.log("👑 Creando datos de prueba...");
    const cliente = await Usuario.create({
      nombre: "Cliente",
      apellido: "Asientos",
      dni: "99887766",
      telefono: "944555666",
      direccion: "Calle Asientos 789",
      fecha_nacimiento: "1991-11-11",
      genero: "masculino",
      email: "cliente@asientos.com",
      password: "cliente123",
      rol: "cliente",
      estado: "activo",
    });

    // Crear película, sede, sala, función
    const pelicula = await Pelicula.create({
      titulo: "Jurassic Park",
      genero: "Aventura",
      clasificacion: "PG-13",
      duracion: 127,
      fecha_estreno: "1993-06-11",
      sinopsis: "Dinosaurios cobran vida",
      tipo: "cartelera",
      estado: "activa",
    });

    const sede = await Sede.create({
      nombre: "Sede Asientos",
      ciudad: "Lima",
      direccion: "Av. Asientos 999",
      telefono: "966555444",
    });

    const sala = await Sala.create({
      nombre: "Sala 10",
      filas: 10,
      columnas: 12,
      id_sede: sede.id,
      estado: "activa",
    });

    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 2);

    const funcion = await Funcion.create({
      id_pelicula: pelicula.id,
      id_sala: sala.id,
      fecha: fechaFutura.toISOString().split("T")[0],
      hora: "16:30:00",
      estado: "activa",
    });
    funcionId = funcion.id;

    console.log("✅ Datos de prueba creados");

    const resCliente = await request(app).post("/usuarios/login").send({
      email: "cliente@asientos.com",
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

  it("📜 Listar asientos de una función (público)", async () => {
    const res = await request(app).get(`/asientos/funcion/${funcionId}`);

    console.log("📤 Asientos listados:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("💺 Bloquear asiento (cliente autenticado)", async () => {
    const res = await request(app)
      .post("/asientos/bloquear")
      .set("Authorization", `Bearer ${tokenCliente}`)
      .send({
        id_funcion: funcionId,
        fila: "A",
        numero: 5,
      });

    console.log("📤 Respuesta al bloquear asiento:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/bloqueado/i);
  });

  it("🔓 Liberar asiento (cliente autenticado)", async () => {
    const res = await request(app)
      .post("/asientos/liberar")
      .set("Authorization", `Bearer ${tokenCliente}`)
      .send({
        id_funcion: funcionId,
        fila: "A",
        numero: 5,
      });

    console.log("📤 Respuesta al liberar asiento:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/liberado/i);
  });
});
