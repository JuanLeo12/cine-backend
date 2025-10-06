const request = require("supertest");
const app = require("../app");
const sequelize = require("../config/db");
const { Usuario, Pelicula, Funcion } = require("../models");

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });

  // Crear un admin directo
  await Usuario.create({
    nombre: "Admin",
    apellido: "Cine",
    email: "admin@cine.local",
    password: "Admin123",
    rol: "admin",
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe("🎬 API de Películas", () => {
  let tokenAdmin;
  let peliculaId;

  const peliculaData = {
    titulo: "Matrix Reloaded",
    genero: "Acción",
    clasificacion: "PG-13",
    sinopsis: "Neo regresa al mundo virtual de la Matrix.",
    imagen_url: "http://imagen.test/matrix.jpg",
    fecha_estreno: "2003-05-15",
    duracion: 138,
  };

  it("📌 Login de admin y obtención de token", async () => {
    const res = await request(app).post("/usuarios/login").send({
      email: "admin@cine.local",
      password: "Admin123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    tokenAdmin = res.body.token;

    console.log("🟢 Token admin:", tokenAdmin.slice(0, 30) + "...");
  });

  it("🎥 Crear película (solo admin)", async () => {
    const res = await request(app)
      .post("/peliculas")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send(peliculaData);

    expect(res.statusCode).toBe(201);
    expect(res.body.pelicula).toHaveProperty("id");
    expect(res.body.pelicula.titulo).toBe(peliculaData.titulo);

    peliculaId = res.body.pelicula.id;
    console.log("🎬 Película creada con ID:", peliculaId);
  });

  it("📜 Listar películas activas (público)", async () => {
    const res = await request(app).get("/peliculas");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].titulo).toBe(peliculaData.titulo);
  });

  it("🔍 Obtener película por ID (público)", async () => {
    const res = await request(app).get(`/peliculas/${peliculaId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(peliculaId);
    expect(res.body.titulo).toBe(peliculaData.titulo);
  });

  it("✏️ Actualizar película (admin)", async () => {
    const res = await request(app)
      .patch(`/peliculas/${peliculaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ genero: "Ciencia Ficción" });

    expect(res.statusCode).toBe(200);
    expect(res.body.pelicula.genero).toBe("Ciencia Ficción");
  });

  it("❌ No debería eliminar película con funciones asociadas", async () => {
    // Crea función asociada para forzar el error
    await Funcion.create({
      id_pelicula: peliculaId,
      fecha: new Date(),
      hora: "20:00",
      estado: "activa",
    });

    const res = await request(app)
      .delete(`/peliculas/${peliculaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("No se puede eliminar");
  });

  it("🗑️ Eliminar película sin funciones asociadas", async () => {
    // Eliminar la función primero
    await Funcion.destroy({ where: { id_pelicula: peliculaId } });

    const res = await request(app)
      .delete(`/peliculas/${peliculaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toContain("inactivada");

    // Confirmar en DB
    const peli = await Pelicula.findByPk(peliculaId);
    expect(peli.estado).toBe("inactiva");
  });
});
