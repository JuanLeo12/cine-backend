const request = require("supertest");
const app = require("../app");
const { sequelize, Usuario, Pelicula, Sala, Sede, Funcion } = require("../models");

describe("🎥 API de Funciones", () => {
  let tokenAdmin;
  let funcionId;
  let peliculaId;
  let salaId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de FUNCIONES...");
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

    // Crear película
    const pelicula = await Pelicula.create({
      titulo: "Matrix",
      genero: "Ciencia ficción",
      clasificacion: "R",
      duracion: 136,
      fecha_estreno: "1999-03-31",
      sinopsis: "Un hacker descubre la verdad sobre la realidad",
      tipo: "cartelera",
      estado: "activa",
    });
    peliculaId = pelicula.id;
    console.log("✅ Película creada:", pelicula.titulo);

    // Crear sede y sala
    const sede = await Sede.create({
      nombre: "Sede Norte",
      ciudad: "Lima",
      direccion: "Av. Norte 456",
      telefono: "987654321",
    });

    const sala = await Sala.create({
      nombre: "Sala Premium 1",
      filas: 10,
      columnas: 12,
      id_sede: sede.id,
      estado: "activa",
    });
    salaId = sala.id;
    console.log("✅ Sala creada:", sala.nombre);

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

  it("🎥 Crear función (solo admin)", async () => {
    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 7);

    const res = await request(app)
      .post("/funciones")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        id_pelicula: peliculaId,
        id_sala: salaId,
        fecha: fechaFutura.toISOString().split("T")[0],
        hora: "18:00:00",
      });

    console.log("📤 Respuesta al crear función:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("funcion");
    expect(res.body.funcion.id_pelicula).toBe(peliculaId);

    funcionId = res.body.funcion.id;
  });

  it("📜 Listar funciones activas (público)", async () => {
    const res = await request(app).get("/funciones");
    console.log("📤 Funciones listadas:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("🔍 Obtener función por ID (público)", async () => {
    const res = await request(app).get(`/funciones/${funcionId}`);
    console.log("📤 Función obtenida:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", funcionId);
  });

  it("✏️ Actualizar función (solo admin)", async () => {
    const res = await request(app)
      .put(`/funciones/${funcionId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        id_pelicula: peliculaId,
        id_sala: salaId,
        fecha: "2025-10-28",
        hora: "20:00:00",
      });

    console.log("📤 Función actualizada:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.funcion.hora).toBe("20:00:00");
  });

  it("🗑️ Cancelar función (solo admin)", async () => {
    const res = await request(app)
      .delete(`/funciones/${funcionId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    console.log("📤 Función cancelada:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/cancelada|inactivada/i);
  });
});
