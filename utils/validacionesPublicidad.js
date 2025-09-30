/**
 * Valida datos de campaña publicitaria
 * @param {object} data
 * @returns {string[]} lista de errores
 */
const validarPublicidad = (data) => {
  const errores = [];
  const { tipo, fecha_inicio, fecha_fin, precio, id_sede } = data;

  if (!tipo || !fecha_inicio || !fecha_fin || !precio || !id_sede) {
    errores.push(
      "Los campos tipo, fecha_inicio, fecha_fin, precio e id_sede son obligatorios"
    );
  }

  if (precio && precio <= 0) {
    errores.push("El precio debe ser mayor que cero");
  }

  if (
    fecha_inicio &&
    fecha_fin &&
    new Date(fecha_fin) < new Date(fecha_inicio)
  ) {
    errores.push("La fecha de fin no puede ser anterior a la fecha de inicio");
  }

  return errores;
};

module.exports = { validarPublicidad };
