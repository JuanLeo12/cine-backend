const request = require("supertest");
const app = require("../app");
const { sequelize, Usuario, TipoTicket } = require("../models");

describe("🎫 API de Tipos de Ticket", () => {
  let tokenAdmin;
  let tipoTicketId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de TIPOS DE TICKET...");
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

    console.log("🔐 Iniciando sesión con admin...");
    const resLogin = await request(app).post("/usuarios/login").send({
      email: "admin@cine.com",
      password: "admin123",
    });

    console.log("📤 Respuesta del login:", resLogin.body);
    expect(resLogin.statusCode).toBe(200);
    tokenAdmin = resLogin.body.token;
    console.log("🟢 Token obtenido correctamente\n");
  });

  afterAll(async () => {
    console.log("\n🔚 Cerrando conexión con base de datos...");
    await sequelize.close();
    console.log("✅ Conexión cerrada correctamente\n");
  });

  it("🎫 Crear tipo de ticket (solo admin)", async () => {
    const res = await request(app)
      .post("/tipos_ticket")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Adulto",
      });

    console.log("📤 Respuesta al crear tipo de ticket:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("tipo");
    expect(res.body.tipo.nombre).toBe("Adulto");

    tipoTicketId = res.body.tipo.id;
  });

  it("📜 Listar tipos de ticket (público)", async () => {
    const res = await request(app).get("/tipos_ticket");
    console.log("📤 Tipos de ticket listados:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("🔍 Obtener tipo de ticket por ID (público)", async () => {
    const res = await request(app).get(`/tipos_ticket/${tipoTicketId}`);
    console.log("📤 Tipo de ticket obtenido:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", tipoTicketId);
    expect(res.body.nombre).toBe("Adulto");
  });

  it("✏️ Actualizar tipo de ticket (solo admin)", async () => {
    const res = await request(app)
      .put(`/tipos_ticket/${tipoTicketId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Niño",
      });

    console.log("📤 Tipo de ticket actualizado:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.tipo.nombre).toBe("Niño");
  });

  it("🗑️ Eliminar tipo de ticket (solo admin)", async () => {
    const res = await request(app)
      .delete(`/tipos_ticket/${tipoTicketId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    console.log("📤 Tipo de ticket eliminado:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/eliminado|inactivado/i);
  });

  it("🚫 Verificar que el tipo de ticket no existe después de eliminar", async () => {
    const res = await request(app).get(`/tipos_ticket/${tipoTicketId}`);
    console.log("📤 Intento de obtener tipo eliminado:", res.statusCode);

    expect(res.statusCode).toBe(404);
  });
});
