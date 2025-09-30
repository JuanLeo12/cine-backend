/**
 * Valida datos para reservar un asiento
 * @param {object} data
 * @returns {string[]} lista de errores
 */
const validarAsiento = (data) => {
  const errores = [];
  if (!data.id_funcion) errores.push("La función es obligatoria");
  if (!data.fila) errores.push("La fila es obligatoria");
  if (!data.numero) errores.push("El número de asiento es obligatorio");

  if (data.numero && data.numero <= 0) {
    errores.push("El número debe ser mayor que cero");
  }

  return errores;
};

module.exports = { validarAsiento };
