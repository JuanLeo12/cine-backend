/**
 * Valida los campos de una sede
 * @param {object} data - datos de la sede
 * @param {boolean} esActualizacion - true si es update
 * @returns {string[]} lista de errores
 */
const validarCamposSede = (data, esActualizacion = false) => {
  const errores = [];
  const { nombre, direccion, ciudad } = data;

  if (!esActualizacion && (!nombre || !direccion || !ciudad)) {
    errores.push("Todos los campos (nombre, dirección y ciudad) son obligatorios");
  }

  if (nombre && nombre.trim().length < 3) {
    errores.push("El nombre de la sede debe tener al menos 3 caracteres");
  }

  if (ciudad && ciudad.trim().length < 2) {
    errores.push("La ciudad debe tener al menos 2 caracteres");
  }

  return errores;
};

module.exports = { validarCamposSede };
