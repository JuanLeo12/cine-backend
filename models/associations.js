const {
  Usuario,
  Pelicula,
  Sala,
  Funcion,
  Pago,
  Sede,
  MetodoPago,
  TipoUsuario,
  OrdenCompra,
  OrdenTicket,
  OrdenCombo,
  Combo,
  Ticket,
  AsientoFuncion,
  ValeCorporativo,
  TarifaCorporativa,
  Publicidad,
  AlquilerSala,
} = require("./index");

// 🔗 Publicidad
Usuario.hasMany(Publicidad, { foreignKey: "id_usuario" });
Publicidad.belongsTo(Usuario, { foreignKey: "id_usuario" });

Sede.hasMany(Publicidad, { foreignKey: "id_sede" });
Publicidad.belongsTo(Sede, { foreignKey: "id_sede" });

Pago.hasOne(Publicidad, { foreignKey: "id_pago" });
Publicidad.belongsTo(Pago, { foreignKey: "id_pago" });

// 🔗 Alquiler de salas
Usuario.hasMany(AlquilerSala, { foreignKey: "id_usuario" });
AlquilerSala.belongsTo(Usuario, { foreignKey: "id_usuario" });

Sala.hasMany(AlquilerSala, { foreignKey: "id_sala" });
AlquilerSala.belongsTo(Sala, { foreignKey: "id_sala" });

Pago.hasOne(AlquilerSala, { foreignKey: "id_pago" });
AlquilerSala.belongsTo(Pago, { foreignKey: "id_pago" });

// 🔗 Vales corporativos
Pago.hasMany(ValeCorporativo, { foreignKey: "id_pago" });
ValeCorporativo.belongsTo(Pago, { foreignKey: "id_pago" });

OrdenCompra.hasMany(ValeCorporativo, { foreignKey: "id_orden_compra" });
ValeCorporativo.belongsTo(OrdenCompra, { foreignKey: "id_orden_compra" });

// 🔗 Tarifas corporativas
Usuario.hasMany(TarifaCorporativa, { foreignKey: "id_cliente_corporativo" });
TarifaCorporativa.belongsTo(Usuario, { foreignKey: "id_cliente_corporativo" });

TipoUsuario.hasMany(TarifaCorporativa, { foreignKey: "id_tipo_usuario" });
TarifaCorporativa.belongsTo(TipoUsuario, { foreignKey: "id_tipo_usuario" });

// 🔗 Ordenes y detalles
OrdenCompra.hasMany(OrdenCombo, { foreignKey: "id_orden_compra" });
OrdenCombo.belongsTo(OrdenCompra, { foreignKey: "id_orden_compra" });

Combo.hasMany(OrdenCombo, { foreignKey: "id_combo" });
OrdenCombo.belongsTo(Combo, { foreignKey: "id_combo" });

OrdenCompra.hasMany(OrdenTicket, { foreignKey: "id_orden_compra" });
OrdenTicket.belongsTo(OrdenCompra, { foreignKey: "id_orden_compra" });

TipoUsuario.hasMany(OrdenTicket, { foreignKey: "id_tipo_usuario" });
OrdenTicket.belongsTo(TipoUsuario, { foreignKey: "id_tipo_usuario" });

OrdenTicket.hasMany(Ticket, { foreignKey: "id_orden_ticket" });
Ticket.belongsTo(OrdenTicket, { foreignKey: "id_orden_ticket" });

AsientoFuncion.hasOne(Ticket, { foreignKey: "id_asiento" });
Ticket.belongsTo(AsientoFuncion, { foreignKey: "id_asiento" });

// 🔗 Infraestructura y funciones
Sede.hasMany(Sala, { foreignKey: "id_sede" });
Sala.belongsTo(Sede, { foreignKey: "id_sede" });

Sala.hasMany(Funcion, { foreignKey: "id_sala" });
Funcion.belongsTo(Sala, { foreignKey: "id_sala" });

Pelicula.hasMany(Funcion, { foreignKey: "id_pelicula" });
Funcion.belongsTo(Pelicula, { foreignKey: "id_pelicula" });

Usuario.hasMany(Funcion, {
  as: "funcionesCorporativas",
  foreignKey: "id_cliente_corporativo",
});
Funcion.belongsTo(Usuario, {
  as: "clienteCorporativo",
  foreignKey: "id_cliente_corporativo",
});

Funcion.hasMany(AsientoFuncion, { foreignKey: "id_funcion" });
AsientoFuncion.belongsTo(Funcion, { foreignKey: "id_funcion" });

Usuario.hasMany(AsientoFuncion, { foreignKey: "id_usuario_bloqueo" });
AsientoFuncion.belongsTo(Usuario, { foreignKey: "id_usuario_bloqueo" });

// 🔗 Función ↔ Pago (nuevo)
Pago.hasOne(Funcion, { foreignKey: "id_pago" });
Funcion.belongsTo(Pago, { foreignKey: "id_pago" });

// 🔗 Orden de compra
Usuario.hasMany(OrdenCompra, { foreignKey: "id_usuario" });
OrdenCompra.belongsTo(Usuario, { foreignKey: "id_usuario" });

Funcion.hasMany(OrdenCompra, { foreignKey: "id_funcion" });
OrdenCompra.belongsTo(Funcion, { foreignKey: "id_funcion" });

// 🔗 Pagos
OrdenCompra.hasOne(Pago, { foreignKey: "id_orden_compra" });
Pago.belongsTo(OrdenCompra, { foreignKey: "id_orden_compra" });

MetodoPago.hasMany(Pago, { foreignKey: "id_metodo_pago" });
Pago.belongsTo(MetodoPago, { foreignKey: "id_metodo_pago" });

module.exports = {
  Usuario,
  Pelicula,
  Sala,
  Funcion,
  Pago,
  Sede,
  MetodoPago,
  TipoUsuario,
  OrdenCompra,
  OrdenTicket,
  OrdenCombo,
  Combo,
  Ticket,
  AsientoFuncion,
  ValeCorporativo,
  TarifaCorporativa,
  Publicidad,
  AlquilerSala,
};
