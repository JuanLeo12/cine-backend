/**
 * Valida datos de tarifa corporativa
 * @param {object} data
 * @returns {string[]} lista de errores
 */
const validarTarifa = (data) => {
  const errores = [];
  const { id_cliente_corporativo, id_tipo_usuario, precio } = data;

  if (!id_cliente_corporativo || !id_tipo_usuario || precio == null) {
    errores.push("id_cliente_corporativo, id_tipo_usuario y precio son obligatorios");
  }

  if (precio && precio <= 0) {
    errores.push("El precio debe ser mayor que cero");
  }

  return errores;
};

module.exports = { validarTarifa };
