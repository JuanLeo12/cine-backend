/**
 * Valida los campos de una sede
 * @param {object} data - datos de la sede
 * @param {boolean} esActualizacion - true si es update
 * @returns {string[]} lista de errores
 */
const validarCamposSede = (data, esActualizacion = false) => {
  const errores = [];
  const { nombre, direccion, ciudad, telefono, imagen_url } = data;

  // Validaciones de campos obligatorios (solo en creación)
  if (!esActualizacion) {
    if (!nombre || nombre.trim().length === 0) {
      errores.push("El nombre de la sede es obligatorio");
    }
    if (!direccion || direccion.trim().length === 0) {
      errores.push("La dirección es obligatoria");
    }
    if (!ciudad || ciudad.trim().length === 0) {
      errores.push("La ciudad es obligatoria");
    }
  }

  // Validaciones de formato
  if (nombre && nombre.trim().length < 3) {
    errores.push("El nombre de la sede debe tener al menos 3 caracteres");
  }

  if (nombre && nombre.trim().length > 100) {
    errores.push("El nombre de la sede no puede superar los 100 caracteres");
  }

  if (direccion && direccion.trim().length < 5) {
    errores.push("La dirección debe tener al menos 5 caracteres");
  }

  if (direccion && direccion.trim().length > 255) {
    errores.push("La dirección no puede superar los 255 caracteres");
  }

  if (ciudad && ciudad.trim().length < 2) {
    errores.push("La ciudad debe tener al menos 2 caracteres");
  }

  if (ciudad && ciudad.trim().length > 100) {
    errores.push("La ciudad no puede superar los 100 caracteres");
  }

  // Validación de teléfono (opcional, pero si se proporciona debe ser válido)
  if (telefono && telefono.trim().length > 0) {
    const telefonoRegex = /^\d{9}$/;
    if (!telefonoRegex.test(telefono.trim())) {
      errores.push("El teléfono debe contener exactamente 9 dígitos numéricos");
    }
  }

  // Validación de imagen_url (opcional, pero si se proporciona debe ser válida)
  if (imagen_url && imagen_url.trim().length > 0) {
    try {
      new URL(imagen_url.trim());
    } catch (e) {
      errores.push("La URL de la imagen no es válida");
    }
  }

  return errores;
};

module.exports = { validarCamposSede };
