/**
 * Valida datos de un OrdenCombo
 * @param {object} data - datos de la orden_combo
 * @returns {string[]} lista de errores
 */
const validarOrdenCombo = (data) => {
  const errores = [];
  const { id_orden_compra, id_combo, cantidad, precio_unitario, descuento } =
    data;

  if (!id_orden_compra) errores.push("id_orden_compra es obligatorio");
  if (!id_combo) errores.push("id_combo es obligatorio");

  if (cantidad == null || cantidad < 1) {
    errores.push("La cantidad debe ser un número mayor o igual a 1");
  }

  if (
    !precio_unitario ||
    isNaN(precio_unitario) ||
    parseFloat(precio_unitario) <= 0
  ) {
    errores.push("El precio_unitario debe ser mayor que 0");
  }

  if (descuento != null && parseFloat(descuento) < 0) {
    errores.push("El descuento no puede ser negativo");
  }

  if (
    descuento != null &&
    precio_unitario &&
    parseFloat(descuento) > parseFloat(precio_unitario)
  ) {
    errores.push("El descuento no puede ser mayor que el precio unitario");
  }

  return errores;
};

module.exports = { validarOrdenCombo };
