const nombreRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ]+$/;

/**
 * Valida datos de método de pago
 * @param {object} data - datos a validar
 * @param {boolean} esActualizacion - true si es update
 * @returns {string[]} lista de errores
 */
const validarMetodoPago = (data, esActualizacion = false) => {
  const errores = [];
  const { nombre } = data;

  if (!esActualizacion && (!nombre || nombre.trim() === "")) {
    errores.push("El nombre del método de pago es obligatorio");
  }

  if (nombre && !nombreRegex.test(nombre.trim())) {
    errores.push("El nombre del método de pago contiene caracteres inválidos");
  }

  return errores;
};

module.exports = { validarMetodoPago };
