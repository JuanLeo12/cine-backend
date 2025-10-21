// Reglas comunes
const soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
const dniRegex = /^\d{8}$/;
const rucRegex = /^\d{11}$/;
const telefonoRegex = /^\d{7,9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida los campos según rol
 * @param {string} rol - cliente | corporativo | admin
 * @param {object} data - datos del usuario
 * @param {boolean} esActualizacion - true si es update
 * @returns {string[]} lista de errores
 */
const validarCamposPorRol = (rol, data, esActualizacion = false) => {
  const errores = [];

  if (rol === "cliente") {
    const {
      nombre,
      apellido,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      email,
      password,
      dni,
    } = data;

    if (
      !esActualizacion &&
      (!nombre ||
        !apellido ||
        !telefono ||
        !direccion ||
        !fecha_nacimiento ||
        !genero ||
        !email ||
        !password ||
        !dni)
    ) {
      errores.push(
        "Todos los campos son obligatorios para cliente excepto foto_perfil y ruc"
      );
    }

    if (nombre && !soloLetrasRegex.test(nombre))
      errores.push("El nombre solo debe contener letras");
    if (apellido && !soloLetrasRegex.test(apellido))
      errores.push("El apellido solo debe contener letras");
    if (dni && !dniRegex.test(dni))
      errores.push("El DNI debe tener exactamente 8 dígitos numéricos");
    if (telefono && !telefonoRegex.test(telefono))
      errores.push("El teléfono debe tener entre 7 y 9 dígitos numéricos");
    if (genero && !["masculino", "femenino"].includes(genero.toLowerCase()))
      errores.push("El género solo puede ser masculino o femenino");
  }

  if (rol === "corporativo") {
    const {
      nombre,
      telefono,
      direccion,
      email,
      password,
      ruc,
      representante,
      cargo,
    } = data;

    if (
      !esActualizacion &&
      (!nombre ||
        !telefono ||
        !direccion ||
        !email ||
        !password ||
        !ruc ||
        !representante ||
        !cargo)
    ) {
      errores.push(
        "Todos los campos son obligatorios para corporativo (nombre, telefono, direccion, email, password, ruc, representante, cargo)"
      );
    }

    if (nombre && !soloLetrasRegex.test(nombre))
      errores.push("El nombre solo debe contener letras");
    if (representante && !soloLetrasRegex.test(representante))
      errores.push("El representante solo debe contener letras");
    if (ruc && !rucRegex.test(ruc))
      errores.push("El RUC debe tener exactamente 11 dígitos numéricos");
    if (telefono && !telefonoRegex.test(telefono))
      errores.push("El teléfono debe tener entre 7 y 9 dígitos numéricos");
  }

  if (rol === "admin") {
    const { nombre, email, password } = data;

    if (!esActualizacion && (!nombre || !email || !password)) {
      errores.push("Nombre, email y contraseña son obligatorios para admin");
    }

    if (nombre && !soloLetrasRegex.test(nombre))
      errores.push("El nombre solo debe contener letras");
  }

  // Validaciones comunes
  if (data.email && !emailRegex.test(data.email))
    errores.push("El formato del correo es inválido");
  if (
    data.password &&
    (data.password.length < 8 || data.password.length > 16)
  ) {
    errores.push("La contraseña debe tener entre 8 y 16 caracteres");
  }

  return errores;
};

module.exports = { validarCamposPorRol };
