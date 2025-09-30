/**
 * Valida los datos para un ticket de orden
 * @param {object} data
 * @returns {string[]} lista de errores
 */
const validarOrdenTicket = (data) => {
  const errores = [];
  const { id_orden_compra, id_tipo_usuario, cantidad, precio_unitario, descuento = 0 } = data;

  if (!id_orden_compra || !id_tipo_usuario || !cantidad || !precio_unitario) {
    errores.push("id_orden_compra, id_tipo_usuario, cantidad y precio_unitario son obligatorios");
  }

  if (descuento < 0 || parseFloat(descuento) > parseFloat(precio_unitario)) {
    errores.push("El descuento no puede ser negativo ni mayor que el precio unitario");
  }

  return errores;
};

module.exports = { validarOrdenTicket };