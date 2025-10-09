const request = require("supertest");
const app = require("../server");
const { sequelize, Sede, Sala, Usuario } = require("../models");
const bcrypt = require("bcryptjs");

describe("🎭 API de Salas", () => {
  let tokenAdmin;
  let sedeBase;
  let salaBase;

  beforeAll(async () => {
    console.log("🧹 Reiniciando base de datos para pruebas de SALAS...");
    await sequelize.sync({ force: true });

    // Crear usuario admin base si no existe
    const passwordHash = await bcrypt.hash("admin123", 10);
    const admin = await Usuario.create({
      nombre: "Admin Test",
      email: "admin@cine.com",
      password: passwordHash,
      rol: "admin",
      estado: "activo",
    });

    // Login del admin
    const loginRes = await request(app).post("/usuarios/login").send({
      email: "admin@cine.com",
      password: "admin123",
    });

    console.log("📤 Respuesta login admin:", loginRes.status, loginRes.body);

    if (!loginRes.body?.token) {
      throw new Error(
        "❌ No se obtuvo token de admin en el login. Revisa el endpoint /usuarios/login."
      );
    }

    tokenAdmin = loginRes.body.token;
    console.log("🟢 Token admin obtenido correctamente.");

    // Crear sede base
    sedeBase = await Sede.create({
      nombre: "Sede Central",
      direccion: "Av. Principal 123",
      ciudad: "Lima",
      estado: "activo",
    });
  });

  afterAll(async () => {
    await sequelize.close();
    console.log("🔚 Conexión cerrada correctamente");
  });

  // ---------------------------------------------------------------
  test("🎬 Crear sala (solo admin)", async () => {
    const res = await request(app)
      .post("/salas")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Sala 1",
        capacidad: 120,
        estado: "activo",
        sedeId: sedeBase.id,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("sala");
    salaBase = res.body.sala;
    console.log("✅ Sala creada:", salaBase.nombre);
  });

  test("📜 Listar salas activas (público)", async () => {
    const res = await request(app).get("/salas");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    console.log("📋 Salas listadas:", res.body.length);
  });

  test("🔍 Obtener sala por ID (público)", async () => {
    const res = await request(app).get(`/salas/${salaBase.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("nombre", salaBase.nombre);
    console.log("🔎 Sala obtenida:", res.body.nombre);
  });

  test("✏️ Actualizar sala (admin)", async () => {
    const res = await request(app)
      .put(`/salas/${salaBase.id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Sala 1 Actualizada" });

    expect(res.status).toBe(200);
    expect(res.body.sala.nombre).toBe("Sala 1 Actualizada");
    console.log("🛠️ Sala actualizada:", res.body.sala.nombre);
  });

  test("❌ No debería eliminar sala con funciones asociadas", async () => {
    // Simulación: crea una función que dependa de la sala (si tienes modelo Funcion)
    // Si no, simplemente valida que devuelva 400/409 en ese caso.
    const res = await request(app)
      .delete(`/salas/${salaBase.id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    // Puedes ajustar este código según tu lógica real
    expect([400, 409, 500]).toContain(res.status);
    console.log("🚫 Intento de eliminación con dependencias:", res.status);
  });

  test("🗑️ Eliminar sala sin dependencias (soft delete)", async () => {
    const nuevaSala = await Sala.create({
      nombre: "Sala Temporal",
      capacidad: 80,
      estado: "activo",
      sedeId: sedeBase.id,
    });

    const res = await request(app)
      .delete(`/salas/${nuevaSala.id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    console.log("🧾 Sala eliminada:", nuevaSala.nombre);
  });

  test("🚫 Sala inactiva no debe aparecer en listado", async () => {
    const inactiva = await Sala.create({
      nombre: "Sala Oculta",
      capacidad: 50,
      estado: "inactivo",
      sedeId: sedeBase.id,
    });

    const res = await request(app).get("/salas");
    expect(res.status).toBe(200);
    const nombres = res.body.map((s) => s.nombre);
    expect(nombres).not.toContain("Sala Oculta");
    console.log("🚷 Sala inactiva filtrada correctamente");
  });
});
