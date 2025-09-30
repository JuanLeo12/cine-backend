/**
 * Valida datos para registrar un alquiler de sala
 * @param {object} data
 * @returns {string[]} lista de errores
 */
const validarAlquiler = (data) => {
  const errores = [];

  if (!data.id_sala) errores.push("La sala es obligatoria");
  if (!data.fecha) errores.push("La fecha es obligatoria");
  if (!data.hora_inicio) errores.push("La hora de inicio es obligatoria");
  if (!data.hora_fin) errores.push("La hora de fin es obligatoria");
  if (data.precio == null) errores.push("El precio es obligatorio");

  if (data.precio && data.precio <= 0) {
    errores.push("El precio debe ser mayor que cero");
  }

  if (data.hora_inicio && data.hora_fin && data.hora_fin <= data.hora_inicio) {
    errores.push("La hora de fin debe ser posterior a la hora de inicio");
  }

  return errores;
};

module.exports = { validarAlquiler };
