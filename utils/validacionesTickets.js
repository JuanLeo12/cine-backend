/**
 * Valida campos obligatorios de un ticket
 * @param {object} data
 * @returns {string[]} lista de errores
 */
const validarTicket = (data) => {
  const errores = [];
  if (!data.id_orden_ticket)
    errores.push("El campo id_orden_ticket es obligatorio");
  if (!data.id_asiento) errores.push("El campo id_asiento es obligatorio");
  return errores;
};

module.exports = { validarTicket };
