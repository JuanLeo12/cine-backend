const request = require("supertest");
const app = require("../app");
const {
  sequelize,
  Usuario,
  OrdenCompra,
  OrdenCombo,
  Combo,
  Funcion,
  Pelicula,
  Sala,
  Sede,
} = require("../models");

describe("🍔 API de Órdenes de Combos", () => {
  let tokenCliente;
  let ordenComboId;
  let ordenCompraId;
  let comboId;

  beforeAll(async () => {
    console.log("\n🧹 Reiniciando base de datos para pruebas de ÓRDENES DE COMBOS...");
    await sequelize.sync({ force: true });

    console.log("👑 Creando datos de prueba...");
    const cliente = await Usuario.create({
      nombre: "Cliente",
      apellido: "Combo",
      dni: "11223344",
      telefono: "966777888",
      direccion: "Calle Combos 123",
      fecha_nacimiento: "1992-03-20",
      genero: "masculino",
      email: "cliente@combos.com",
      password: "cliente123",
      rol: "cliente",
      estado: "activo",
    });

    const combo = await Combo.create({
      nombre: "Combo Duo",
      descripcion: "2 bebidas + 1 canchita mediana",
      precio: 25.0,
      estado: "activo",
    });
    comboId = combo.id;

    // Crear película, sede, sala, función
    const pelicula = await Pelicula.create({
      titulo: "Fast & Furious",
      genero: "Acción",
      clasificacion: "PG-13",
      duracion: 130,
      fecha_estreno: "2023-05-01",
      sinopsis: "Carreras de autos",
      tipo: "cartelera",
      estado: "activa",
    });

    const sede = await Sede.create({
      nombre: "Sede Oeste",
      ciudad: "Lima",
      direccion: "Av. Oeste 222",
      telefono: "988333444",
      estado: "activa",
    });

    const sala = await Sala.create({
      nombre: "Sala 8",
      filas: 12,
      columnas: 15,
      id_sede: sede.id,
      estado: "activa",
    });

    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 4);

    const funcion = await Funcion.create({
      id_pelicula: pelicula.id,
      id_sala: sala.id,
      fecha: fechaFutura.toISOString().split("T")[0],
      hora: "16:00:00",
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
      email: "cliente@combos.com",
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

  it("🍔 Crear orden de combo (cliente)", async () => {
    const res = await request(app)
      .post("/ordenes_combos")
      .set("Authorization", `Bearer ${tokenCliente}`)
      .send({
        id_orden_compra: ordenCompraId,
        id_combo: comboId,
        cantidad: 1,
        precio_unitario: 25.0,
        descuento: 0,
      });

    console.log("📤 Respuesta al crear orden combo:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("ordenCombo");

    ordenComboId = res.body.ordenCombo.id;
  });

  it("📜 Listar órdenes de combos", async () => {
    const res = await request(app)
      .get("/ordenes_combos")
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("📤 Órdenes de combos listadas:", res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("🗑️ Eliminar orden de combo", async () => {
    const res = await request(app)
      .delete(`/ordenes_combos/${ordenComboId}`)
      .set("Authorization", `Bearer ${tokenCliente}`);

    console.log("📤 Orden combo eliminada:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/eliminado|eliminada/i);
  });
});
