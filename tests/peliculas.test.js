// tests/peliculas.test.js
const request = require("supertest");
const app = require("../app");
const sequelize = require("../config/db");
const { Usuario, Pelicula, Funcion, Sede, Sala } = require("../models");

beforeAll(async () => {
  await sequelize.sync({ force: true });
  console.log("🧹 BD reiniciada correctamente para test de películas");

  // Crear sede y sala necesarias para funciones
  const sede = await Sede.create({
    nombre: "Cine Central",
    direccion: "Av. Principal 123",
    ciudad: "Lima",
  });

  const sala = await Sala.create({
    nombre: "Sala 1",
    filas: 10,
    columnas: 10,
    id_sede: sede.id,
  });

  console.log(`🏢 Sede creada: ${sede.nombre} - Sala asociada: ${sala.nombre}`);

  // Crear admin
  await Usuario.create({
    nombre: "Admin",
    apellido: "Test",
    email: "admin@test.local",
    password: "AdminPass123",
    rol: "admin",
  });
});

afterAll(async () => {
  await sequelize.close();
  console.log("🔚 Conexión cerrada correctamente");
});

describe("🎬 API de Películas", () => {
  let tokenAdmin;
  let peliculaId;
  let sala;
  let sede;

  const peliculaData = {
    titulo: "Interstellar",
    genero: "Ciencia ficción",
    clasificacion: "PG-13",
    sinopsis: "Exploradores buscan un nuevo hogar para la humanidad.",
    imagen_url: "http://example.com/interstellar.jpg",
    fecha_estreno: "2025-01-01",
    duracion: 169,
  };

  it("📌 Login de admin y obtención de token", async () => {
    const res = await request(app).post("/usuarios/login").send({
      email: "admin@test.local",
      password: "AdminPass123",
    });

    expect(res.statusCode).toBe(200);
    tokenAdmin = res.body.token;
    console.log("🟢 Token admin:", tokenAdmin.substring(0, 60) + "...");
  });

  it("🎥 Crear película (solo admin)", async () => {
    const res = await request(app)
      .post("/peliculas")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(peliculaData);

    expect(res.statusCode).toBe(201);
    peliculaId = res.body.pelicula.id;
    console.log("🎬 Película creada:", res.body.pelicula);
  });

  it("📜 Listar películas activas (público)", async () => {
    const res = await request(app).get("/peliculas");
    expect(res.statusCode).toBe(200);
    console.log("🎞️ Películas activas encontradas:", res.body);
  });

  it("🔍 Obtener película por ID (público)", async () => {
    const res = await request(app).get(`/peliculas/${peliculaId}`);
    expect(res.statusCode).toBe(200);
    console.log("🎥 Película obtenida por ID:", res.body);
  });

  it("✏️ Actualizar película (admin)", async () => {
    const res = await request(app)
      .patch(`/peliculas/${peliculaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ genero: "Ciencia Ficción" });

    if (res.statusCode !== 200) {
      console.error("⚠️ Error al actualizar película:", res.body);
    }

    expect(res.statusCode).toBe(200);
    console.log("✅ Película actualizada correctamente:", res.body.pelicula);
  });

  it("❌ No debería eliminar película con funciones asociadas", async () => {
    // Crear una función vinculada a la película
    const sede = await Sede.findOne();
    const sala = await Sala.findOne();

    await Funcion.create({
      id_pelicula: peliculaId,
      id_sala: sala.id,
      fecha: new Date(),
      hora: "20:00",
    });

    const res = await request(app)
      .delete(`/peliculas/${peliculaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(400);
    console.log(
      "🚫 Intento de eliminar película con función asociada bloqueado"
    );
  });

  it("🗑️ Eliminar película sin funciones asociadas", async () => {
    await Funcion.destroy({ where: { id_pelicula: peliculaId } });

    const res = await request(app)
      .delete(`/peliculas/${peliculaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    console.log("🗑️ Película eliminada (inactivada):", peliculaId);
  });

  it("🚫 Película inactiva no debe aparecer en el listado", async () => {
    const res = await request(app).get("/peliculas");
    const encontrada = res.body.find((p) => p.id === peliculaId);

    expect(encontrada).toBeUndefined();
    console.log("✅ Película inactiva no aparece en el listado final");
  });
});
