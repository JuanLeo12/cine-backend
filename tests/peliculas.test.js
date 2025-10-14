const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../app");
const { sequelize, Usuario, Pelicula } = require("../models");

describe("🎬 API de Películas", () => {
  let tokenAdmin;
  let peliculaId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de PELÍCULAS...");
    await sequelize.sync({ force: true });

    console.log("👑 Creando usuario admin base...");

    // 🔐 Crear admin manualmente con bcrypt (mismo método que el modelo)
    const admin = await Usuario.create({
      nombre: "Administrador",
      email: "admin@cine.com",
      password: "admin123",
      rol: "admin",
      estado: "activo",
    });

    console.log("✅ Admin creado correctamente:", {
      id: admin.id,
      email: admin.email,
      rol: admin.rol,
    });

    console.log("🔐 Iniciando sesión con admin...");

    // 🔑 Iniciar sesión
    const resLogin = await request(app)
      .post("/usuarios/login")
      .send({ email: "admin@cine.com", password: "admin123" });

    console.log("📤 Respuesta del login:", resLogin.body);

    expect(resLogin.statusCode).toBe(200);
    tokenAdmin = resLogin.body.token;
    console.log("🟢 Token obtenido correctamente");
  });

  // 🎞️ Crear película
  test("🎞️ Crear película (solo admin)", async () => {
    const res = await request(app)
      .post("/peliculas")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        titulo: "Inception",
        genero: "Ciencia ficción",
        clasificacion: "PG-13",
        duracion: 148,
        fecha_estreno: "2010-07-16",
        sinopsis: "Un ladrón roba secretos a través del sueño.",
        imagen_url: "https://image.tmdb.org/t/p/inception.jpg",
        tipo: "cartelera",
      });

    console.log("📤 Respuesta al crear película:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("pelicula");
    peliculaId = res.body.pelicula.id;
  });

  // 📜 Listar películas activas
  test("📜 Listar películas activas (público)", async () => {
    const res = await request(app).get("/peliculas");
    console.log("📤 Películas listadas:", res.body);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // 🔍 Obtener película por ID
  test("🔍 Obtener película por ID (público)", async () => {
    const res = await request(app).get(`/peliculas/${peliculaId}`);
    console.log("📤 Película obtenida:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(peliculaId);
  });

  // ✏️ Actualizar película
  test("✏️ Actualizar película (solo admin)", async () => {
    const res = await request(app)
      .put(`/peliculas/${peliculaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ titulo: "Inception (Updated)" });

    console.log("📤 Película actualizada:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.pelicula.titulo).toBe("Inception (Updated)");
  });

  // 🗑️ Eliminar película
  test("🗑️ Eliminar película (soft delete, solo admin)", async () => {
    const res = await request(app)
      .delete(`/peliculas/${peliculaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    console.log("📤 Película eliminada:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/eliminada|inactiva/i);
  });

  // 🚫 Verificar que película inactiva no aparece en listado
  test("🚫 Verificar que película inactiva no aparece en listado", async () => {
    const res = await request(app).get("/peliculas");
    console.log("📤 Listado tras eliminación:", res.body);
    const existe = res.body.some((p) => p.id === peliculaId);
    expect(existe).toBe(false);
  });

  afterAll(async () => {
    console.log("\n🔚 Cerrando conexión con base de datos...");
    await sequelize.close();
    console.log("✅ Conexión cerrada correctamente");
  });
});
