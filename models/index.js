const Usuario = require("./usuario");
const Pelicula = require("./pelicula");
const Sala = require("./sala");
const Funcion = require("./funcion");
const Pago = require("./pago");
const Sede = require("./sede");
const MetodoPago = require("./metodo_pago");
const TipoUsuario = require("./tipo_usuario");
const AsientoFuncion = require("./asiento_funcion");
const Ticket = require("./ticket");
const OrdenTicket = require("./orden_ticket");
const OrdenCombo = require("./orden_combo");
const OrdenCompra = require("./orden_compra");
const Combo = require("./combo");
const ValeCorporativo = require("./vale_corporativo");
const TarifaCorporativa = require("./tarifa_corporativa");
const Publicidad = require("./publicidad");
const AlquilerSala = require("./alquiler_sala");
const sequelize = require("../config/db"); 

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
  sequelize
};
