const Usuario = require("./usuario");
const Pelicula = require("./pelicula");
const Sala = require("./sala");
const Funcion = require("./funcion");
const Pago = require("./pago");
const Sede = require("./sede");
const MetodoPago = require("./metodo_pago");
const TipoTicket = require("./tipo_ticket");
const AsientoFuncion = require("./asiento_funcion");
const Ticket = require("./ticket");
const OrdenTicket = require("./orden_ticket");
const OrdenCombo = require("./orden_combo");
const OrdenCompra = require("./orden_compra");
const Combo = require("./combo");
const ValeCorporativo = require("./vale_corporativo");
const TarifaCorporativa = require("./tarifa_corporativa");
const TarifaSala = require("./tarifa_sala");
const Publicidad = require("./publicidad");
const AlquilerSala = require("./alquiler_sala");
const BoletaCorporativa = require("./boleta_corporativa");
const sequelize = require("../config/db"); 

// Exportar todos los modelos
const models = {
  Usuario,
  Pelicula,
  Sala,
  Funcion,
  Pago,
  Sede,
  MetodoPago,
  TipoTicket,
  OrdenCompra,
  OrdenTicket,
  OrdenCombo,
  Combo,
  Ticket,
  AsientoFuncion,
  ValeCorporativo,
  TarifaCorporativa,
  TarifaSala,
  Publicidad,
  AlquilerSala,
  BoletaCorporativa,
  sequelize
};

// 🔗 Definir todas las asociaciones DESPUÉS de exportar
// Esto evita dependencias circulares

// 🔗 Publicidad
Usuario.hasMany(Publicidad, { foreignKey: "id_usuario", as: "publicidades" });
Publicidad.belongsTo(Usuario, { foreignKey: "id_usuario", as: "usuario" });

Sede.hasMany(Publicidad, { foreignKey: "id_sede", as: "publicidadesSede" });
Publicidad.belongsTo(Sede, { foreignKey: "id_sede", as: "sede" });

Pago.hasOne(Publicidad, { foreignKey: "id_pago", as: "publicidad" });
Publicidad.belongsTo(Pago, { foreignKey: "id_pago", as: "pago" });

// 🔗 Alquiler de salas
Usuario.hasMany(AlquilerSala, { foreignKey: "id_usuario", as: "alquileres" });
AlquilerSala.belongsTo(Usuario, { foreignKey: "id_usuario", as: "usuario" });

Sala.hasMany(AlquilerSala, { foreignKey: "id_sala", as: "alquileres" });
AlquilerSala.belongsTo(Sala, { foreignKey: "id_sala", as: "sala" });

Pago.hasOne(AlquilerSala, { foreignKey: "id_pago", as: "alquiler" });
AlquilerSala.belongsTo(Pago, { foreignKey: "id_pago", as: "pago" });

// 🔗 Boletas corporativas
Funcion.hasMany(BoletaCorporativa, { 
  foreignKey: "id_referencia", 
  constraints: false,
  scope: { tipo: 'funcion_privada' },
  as: "boletasFuncion" 
});

AlquilerSala.hasMany(BoletaCorporativa, { 
  foreignKey: "id_referencia", 
  constraints: false,
  scope: { tipo: 'alquiler_sala' },
  as: "boletasAlquiler" 
});

BoletaCorporativa.belongsTo(Funcion, { 
  foreignKey: "id_referencia", 
  constraints: false,
  as: "funcionPrivada" 
});

BoletaCorporativa.belongsTo(AlquilerSala, { 
  foreignKey: "id_referencia", 
  constraints: false,
  as: "alquilerSala" 
});

// 🔗 Vales corporativos
Pago.hasMany(ValeCorporativo, {
  foreignKey: "id_pago",
  as: "valesCorporativos",
});
ValeCorporativo.belongsTo(Pago, { foreignKey: "id_pago", as: "pago" });

OrdenCompra.hasMany(ValeCorporativo, {
  foreignKey: "id_orden_compra",
  as: "valesCorporativos",
});
ValeCorporativo.belongsTo(OrdenCompra, {
  foreignKey: "id_orden_compra",
  as: "ordenCompra",
});

// 🔗 Tarifas corporativas
Usuario.hasMany(TarifaCorporativa, {
  foreignKey: "id_cliente_corporativo",
  as: "tarifasCorporativas",
});
TarifaCorporativa.belongsTo(Usuario, {
  foreignKey: "id_cliente_corporativo",
  as: "clienteCorporativo",
});

TipoTicket.hasMany(TarifaCorporativa, {
  foreignKey: "id_tipo_usuario",
  as: "tarifasCorporativas",
});
TarifaCorporativa.belongsTo(TipoTicket, {
  foreignKey: "id_tipo_usuario",
  as: "tipoTicket",
});

// 🔗 Tarifas por sala
TipoTicket.hasMany(TarifaSala, {
  foreignKey: "id_tipo_ticket",
  as: "tarifasSala",
});
TarifaSala.belongsTo(TipoTicket, {
  foreignKey: "id_tipo_ticket",
  as: "tipoTicket",
});

// 🔗 Ordenes y detalles
OrdenCompra.hasMany(OrdenCombo, {
  foreignKey: "id_orden_compra",
  as: "ordenCombos",
});
OrdenCombo.belongsTo(OrdenCompra, {
  foreignKey: "id_orden_compra",
  as: "ordenCompra",
});

Combo.hasMany(OrdenCombo, { foreignKey: "id_combo", as: "ordenCombos" });
OrdenCombo.belongsTo(Combo, { foreignKey: "id_combo", as: "combo" });

OrdenCompra.hasMany(OrdenTicket, {
  foreignKey: "id_orden_compra",
  as: "ordenTickets",
});
OrdenTicket.belongsTo(OrdenCompra, {
  foreignKey: "id_orden_compra",
  as: "ordenCompra",
});

TipoTicket.hasMany(OrdenTicket, {
  foreignKey: "id_tipo_usuario",
  as: "ordenTickets",
});
OrdenTicket.belongsTo(TipoTicket, {
  foreignKey: "id_tipo_ticket",
  as: "tipoTicket",
});

OrdenTicket.hasMany(Ticket, { foreignKey: "id_orden_ticket", as: "tickets" });
Ticket.belongsTo(OrdenTicket, {
  foreignKey: "id_orden_ticket",
  as: "ordenTicket",
});

AsientoFuncion.hasOne(Ticket, { foreignKey: "id_asiento", as: "ticket" });
Ticket.belongsTo(AsientoFuncion, {
  foreignKey: "id_asiento",
  as: "asientoFuncion",
});

// 🔗 Infraestructura y funciones
Sede.hasMany(Sala, { foreignKey: "id_sede", as: "salas" });
Sala.belongsTo(Sede, { foreignKey: "id_sede", as: "sede" });

Sala.hasMany(Funcion, { foreignKey: "id_sala", as: "funciones" });
Funcion.belongsTo(Sala, { foreignKey: "id_sala", as: "sala" });

Pelicula.hasMany(Funcion, { foreignKey: "id_pelicula", as: "funciones" });
Funcion.belongsTo(Pelicula, { foreignKey: "id_pelicula", as: "pelicula" });

Usuario.hasMany(Funcion, {
  as: "funcionesCorporativas",
  foreignKey: "id_cliente_corporativo",
});
Funcion.belongsTo(Usuario, {
  as: "clienteCorporativo",
  foreignKey: "id_cliente_corporativo",
});

Funcion.hasMany(AsientoFuncion, { foreignKey: "id_funcion", as: "asientos" });
AsientoFuncion.belongsTo(Funcion, { foreignKey: "id_funcion", as: "funcion" });

Usuario.hasMany(AsientoFuncion, {
  foreignKey: "id_usuario_bloqueo",
  as: "asientosBloqueados",
});
AsientoFuncion.belongsTo(Usuario, {
  foreignKey: "id_usuario_bloqueo",
  as: "usuarioBloqueo",
});

// 🔗 Orden de compra
Usuario.hasMany(OrdenCompra, { foreignKey: "id_usuario", as: "ordenesCompra" });
OrdenCompra.belongsTo(Usuario, { foreignKey: "id_usuario", as: "usuario" });

Funcion.hasMany(OrdenCompra, { foreignKey: "id_funcion", as: "ordenesCompra" });
OrdenCompra.belongsTo(Funcion, { foreignKey: "id_funcion", as: "funcion" });

// 🔗 Pagos
OrdenCompra.hasOne(Pago, { foreignKey: "id_orden_compra", as: "pago" });
Pago.belongsTo(OrdenCompra, {
  foreignKey: "id_orden_compra",
  as: "ordenCompra",
});

MetodoPago.hasMany(Pago, { foreignKey: "id_metodo_pago", as: "pagos" });
Pago.belongsTo(MetodoPago, { foreignKey: "id_metodo_pago", as: "metodoPago" });

module.exports = models;
