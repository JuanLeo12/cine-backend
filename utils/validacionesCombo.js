/**
 * Valida datos de un combo
 * @param {object} data - datos a validar
 * @param {boolean} esActualizacion - true si es update
 * @returns {string[]} lista de errores
 */
const validarCombo = (data, esActualizacion = false) => {
  const errores = [];
  const { nombre, precio } = data;

  if (!esActualizacion && (!nombre || precio == null)) {
    errores.push("Nombre y precio son obligatorios");
  }

  if (nombre && nombre.trim().length < 3) {
    errores.push("El nombre del combo debe tener al menos 3 caracteres");
  }

  if (precio != null && (isNaN(precio) || parseFloat(precio) <= 0)) {
    errores.push("El precio debe ser un número mayor que 0");
  }

  return errores;
};

module.exports = { validarCombo };