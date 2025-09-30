/**
 * Valida los campos de un vale corporativo
 * @param {object} data
 * @returns {string[]} lista de errores
 */
const validarVale = (data) => {
  const errores = [];
  if (!data.codigo) errores.push("El código es obligatorio");
  if (!data.tipo) errores.push("El tipo es obligatorio");
  if (!data.valor) errores.push("El valor es obligatorio");
  if (!data.fecha_expiracion)
    errores.push("La fecha de expiración es obligatoria");

  if (data.valor && data.valor <= 0) {
    errores.push("El valor debe ser mayor que cero");
  }
  if (data.fecha_expiracion && new Date(data.fecha_expiracion) <= new Date()) {
    errores.push("La fecha de expiración debe ser futura");
  }

  return errores;
};

module.exports = { validarVale };
