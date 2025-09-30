/**
 * Valida los datos para registrar un pago
 * @param {object} data
 * @returns {string[]} lista de errores
 */
const validarPago = (data) => {
  const errores = [];
  const {
    id_orden_compra,
    id_funcion,
    id_metodo_pago,
    monto_total,
    estado_pago,
  } = data;

  if ((!id_orden_compra && !id_funcion) || !id_metodo_pago || !monto_total) {
    errores.push(
      "Debes indicar orden de compra o función, método de pago y monto total"
    );
  }

  if (monto_total <= 0) {
    errores.push("El monto total debe ser mayor que 0");
  }

  if (
    estado_pago &&
    !["pendiente", "completado", "fallido"].includes(estado_pago)
  ) {
    errores.push("Estado de pago inválido");
  }

  return errores;
};

module.exports = { validarPago };
