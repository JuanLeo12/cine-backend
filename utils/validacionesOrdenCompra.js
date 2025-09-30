/**
 * Valida datos de creación de una Orden de Compra
 * @param {object} data - datos de la orden
 * @returns {string[]} lista de errores
 */
const validarOrdenCompra = (data) => {
  const errores = [];
  const { id_funcion, tickets = [] } = data;

  if (tickets.length > 0 && !id_funcion) {
    errores.push("La función es obligatoria si la orden incluye tickets");
  }

  return errores;
};

module.exports = { validarOrdenCompra };
