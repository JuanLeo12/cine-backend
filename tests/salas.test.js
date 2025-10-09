const request = require("supertest");
const app = require("../app");
const sequelize = require("../config/db");
const { Usuario, Sede, Sala, Funcion } = require("../models");
const bcrypt = require("bcryptjs");

let tokenAdmin;
let sedeId;
let salaId;

beforeAll(async () => {
  console.log("🧹 Reiniciando base de datos para pruebas de SALAS...");
  await sequelize.sync({ force: true });

  // Crear admin
  const passwordHash = await bcrypt.hash("123456", 1);
  const admin = await Usuario.create({
    nombre: "Admin Salas",
    email: "adminsalas@cine.com",
    password: passwordHash,
    rol: "admin",
  });

  // Login
  const loginRes = await request(app).post("/api/usuarios/login").send({
    email: "adminsalas@cine.com",
    password: "123456",
  });

  tokenAdmin = loginRes.body.token;
  console.log("🟢 Token admin:", tokenAdmin.slice(0, 40) + "...");

  // Crear sede base
  const sede = await Sede.create({
    nombre: "Cine Downtown",
    direccion: "Av. Central 456",
    ciudad: "Lima",
  });
  sedeId = sede.id;
  console.log("🏢 Sede creada con ID:", sedeId);
});

afterAll(async () => {
  await sequelize.close();
  console.log("🔚 Conexión cerrada correctamente");
});

describe("🎭 API de Salas", () => {
  it("🎬 Crear sala (solo admin)", async () => {
    const res = await request(app)
      .post("/api/salas")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Sala Principal",
        filas: 10,
        columnas: 20,
        id_sede: sedeId,
      });

    if (res.statusCode !== 201) console.error("⚠️ Error crear sala:", res.body);
    expect(res.statusCode).toBe(201);
    salaId = res.body.sala.id;
    console.log("🎥 Sala creada con ID:", salaId);
  });

  it("📜 Listar salas activas (público)", async () => {
    const res = await request(app).get("/api/salas");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    console.log(`🎞️ Se listaron ${res.body.length} salas activas`);
  });

  it("🔍 Obtener sala por ID (público)", async () => {
    const res = await request(app).get(`/api/salas/${salaId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.nombre).toBe("Sala Principal");
    console.log("🎟️ Detalle obtenido:", res.body.nombre);
  });

  it("✏️ Actualizar sala (admin)", async () => {
    const res = await request(app)
      .patch(`/api/salas/${salaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Sala Premium", filas: 12, columnas: 25, id_sede: sedeId });

    if (res.statusCode !== 200)
      console.error("⚠️ Error actualizar sala:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.sala.nombre).toBe("Sala Premium");
    console.log("✅ Sala actualizada correctamente");
  });

  it("❌ No debería eliminar sala con funciones asociadas", async () => {
    await Funcion.create({
      id_pelicula: 1,
      id_sala: salaId,
      fecha: new Date(),
      hora: "18:00",
      estado: "activa",
    });

    const res = await request(app)
      .delete(`/api/salas/${salaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/funciones asociadas/i);
    console.log("🚫 Intento de eliminar sala con función asociada bloqueado");

    // Limpieza
    await Funcion.destroy({ where: { id_sala: salaId } });
  });

  it("🗑️ Eliminar sala sin dependencias (soft delete)", async () => {
    const res = await request(app)
      .delete(`/api/salas/${salaId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    console.log("🗑️ Sala inactivada correctamente");
  });

  it("🚫 Sala inactiva no debe aparecer en listado", async () => {
    const res = await request(app).get("/api/salas");
    const existe = res.body.find((s) => s.id === salaId);
    expect(existe).toBeUndefined();
    console.log("✅ Sala inactiva no aparece en el listado");
  });
});
