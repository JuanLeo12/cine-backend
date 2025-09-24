const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

// 📌 Registro de usuario - Listo
exports.registrarUsuario = async (req, res) => {
  try {

    let {
      nombre,
      apellido,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      foto_perfil,
      estado,
      dni,
      ruc,
      email,
      password,
      rol
    } = req.body;

    const rolUsuario = rol || "cliente";
    // Validaciones según rol

    // Validaciones por rol y formato de campos
    const soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
    const dniRegex = /^\d{8}$/;
    const rucRegex = /^\d{11}$/;
    const telefonoRegex = /^\d{7,9}$/;
    const generoOpciones = ["masculino", "femenino"];

    if (rolUsuario === "cliente") {
      if (!nombre || !apellido || !telefono || !direccion || !fecha_nacimiento || !genero || !email || !password || !dni) {
        return res.status(400).json({ error: "Todos los campos son obligatorios para cliente excepto foto_perfil y ruc" });
      }
      if (!soloLetrasRegex.test(nombre)) {
        return res.status(400).json({ error: "El nombre solo debe contener letras" });
      }
      if (!soloLetrasRegex.test(apellido)) {
        return res.status(400).json({ error: "El apellido solo debe contener letras" });
      }
      if (!dniRegex.test(dni)) {
        return res.status(400).json({ error: "El DNI debe tener exactamente 8 dígitos numéricos" });
      }
      if (!telefonoRegex.test(telefono)) {
        return res.status(400).json({ error: "El teléfono debe tener entre 7 y 9 dígitos numéricos" });
      }
      if (!generoOpciones.includes(genero.toLowerCase())) {
        return res.status(400).json({ error: "El género solo puede ser masculino o femenino" });
      }
      ruc = undefined;
    } else if (rolUsuario === "corporativo") {
      if (!nombre || !telefono || !direccion || !email || !password || !ruc) {
        return res.status(400).json({ error: "Todos los campos son obligatorios para corporativo excepto foto_perfil" });
      }
      if (!soloLetrasRegex.test(nombre)) {
        return res.status(400).json({ error: "El nombre solo debe contener letras" });
      }
      if (!rucRegex.test(ruc)) {
        return res.status(400).json({ error: "El RUC debe tener exactamente 11 dígitos numéricos" });
      }
      if (!telefonoRegex.test(telefono)) {
        return res.status(400).json({ error: "El teléfono debe tener entre 7 y 9 dígitos numéricos" });
      }
      dni = undefined;
      apellido = undefined;
      fecha_nacimiento = undefined;
      genero = undefined;
    } else if (rolUsuario === "admin") {
      if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios para admin" });
      }
      if (!soloLetrasRegex.test(nombre)) {
        return res.status(400).json({ error: "El nombre solo debe contener letras" });
      }
      dni = undefined;
      ruc = undefined;
      apellido = undefined;
      fecha_nacimiento = undefined;
      genero = undefined;
    }


    // Validación de email y password (una sola vez)
    email = email ? email.trim().toLowerCase() : "";
    const emailRegex = /^[^\s@]+@[^\u0000-\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "El formato del correo es inválido" });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 16) {
      return res.status(400).json({ error: "La contraseña debe tener entre 8 y 16 caracteres" });
    }
    console.log('Password recibido para registro:', password);

    // Unicidad de email
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    // Unicidad de dni
    if (dni) {
      const existeDni = await Usuario.findOne({ where: { dni } });
      if (existeDni) {
        return res.status(409).json({ error: "El DNI ya está registrado" });
      }
    }
    // Unicidad de ruc
    if (ruc) {
      const existeRuc = await Usuario.findOne({ where: { ruc } });
      if (existeRuc) {
        return res.status(409).json({ error: "El RUC ya está registrado" });
      }
    }

    // Roles permitidos y control de asignación
    const rolesPermitidos = ["cliente", "admin", "corporativo"];
    if (rol && !rolesPermitidos.includes(rol)) {
      return res.status(400).json({ error: "Rol inválido" });
    }
    // Solo un admin puede crear usuarios con rol admin
    if (rol === "admin" && (!req.user || req.user.rol !== "admin")) {
      return res.status(403).json({ error: "No tienes permiso para asignar el rol admin" });
    }

    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      apellido: apellido !== undefined ? (apellido ? apellido.trim() : null) : null,
      telefono: telefono ? telefono.trim() : null,
      direccion: direccion ? direccion.trim() : null,
      fecha_nacimiento: fecha_nacimiento || null,
      genero: genero !== undefined ? (genero ? genero.trim() : null) : null,
      foto_perfil: foto_perfil ? foto_perfil.trim() : null,
      estado: estado ? estado.trim() : undefined,
      dni: dni ? dni.trim() : null,
      ruc: ruc ? ruc.trim() : null,
      email,
      password,
      rol: rol || "cliente",
    });

    res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
        telefono: nuevoUsuario.telefono,
        direccion: nuevoUsuario.direccion,
        fecha_nacimiento: nuevoUsuario.fecha_nacimiento,
        genero: nuevoUsuario.genero,
        foto_perfil: nuevoUsuario.foto_perfil,
        estado: nuevoUsuario.estado,
        dni: nuevoUsuario.dni,
        ruc: nuevoUsuario.ruc,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        fecha_registro: nuevoUsuario.fecha_registro,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

// 📌 Login de usuario - Listo
exports.loginUsuario = async (req, res) => {
  try {

    let { email, password } = req.body;

    console.log('Intento de login:', { email, password });

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });
    }

    email = email.trim().toLowerCase();

    // Usar scope 'withPassword' para incluir el campo password
    const usuario = await Usuario.scope('withPassword').findOne({ where: { email } });
    if (!usuario) {
      console.log('Usuario no encontrado para email:', email);
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    console.log('Hash en BD:', usuario.password);

    const passwordValida = await bcrypt.compare(password, usuario.password);
    console.log('¿Password válida?', passwordValida);
    if (!passwordValida) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      mensaje: "Login exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        fecha_nacimiento: usuario.fecha_nacimiento,
        genero: usuario.genero,
        foto_perfil: usuario.foto_perfil,
        estado: usuario.estado,
        dni: usuario.dni,
        ruc: usuario.ruc,
        email: usuario.email,
        rol: usuario.rol,
        fecha_registro: usuario.fecha_registro,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

// 📌 Perfil autenticado - Listo
exports.obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.user.id, {
      attributes: [
        "id",
        "nombre",
        "apellido",
        "telefono",
        "direccion",
        "fecha_nacimiento",
        "genero",
        "foto_perfil",
        "estado",
        "dni",
        "ruc",
        "email",
        "rol",
        "fecha_registro"
      ],
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
};

// 📌 Listado general de usuarios (solo admin) - Listo
exports.listarUsuarios = async (req, res) => {
  try {
    if (req.user.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const usuarios = await Usuario.findAll({
      attributes: [
        "id",
        "nombre",
        "apellido",
        "telefono",
        "direccion",
        "fecha_nacimiento",
        "genero",
        "foto_perfil",
        "estado",
        "dni",
        "ruc",
        "email",
        "rol",
        "fecha_registro"
      ],
      order: [["fecha_registro", "DESC"]],
    });

    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// 📌 Actualizar usuario (admin o el propio usuario) 
exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Solo admin o el propio usuario
    if (req.user.rol !== "admin" && req.user.id !== parseInt(id)) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar este usuario" });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const {
      nombre,
      apellido,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      foto_perfil,
      estado,
      dni,
      ruc,
      email,
      password,
      rol
    } = req.body;


    // Validaciones por rol y formato de campos (igual que en registro)
    const soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
    const dniRegex = /^\d{8}$/;
    const rucRegex = /^\d{11}$/;
    const telefonoRegex = /^\d{7,9}$/;
    const generoOpciones = ["masculino", "femenino"];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Determinar rol actual o nuevo
    const rolUsuario = rol || usuario.rol || "cliente";

    if (rolUsuario === "cliente") {
      // Obligatorios: nombre, apellido, telefono, direccion, fecha_nacimiento, genero, email, dni
      if (
        (nombre !== undefined && !nombre) ||
        (apellido !== undefined && !apellido) ||
        (telefono !== undefined && !telefono) ||
        (direccion !== undefined && !direccion) ||
        (fecha_nacimiento !== undefined && !fecha_nacimiento) ||
        (genero !== undefined && !genero) ||
        (email !== undefined && !email) ||
        (dni !== undefined && !dni)
      ) {
        return res.status(400).json({ error: "Todos los campos son obligatorios para cliente excepto foto_perfil y ruc" });
      }
      if (nombre && !soloLetrasRegex.test(nombre)) {
        return res.status(400).json({ error: "El nombre solo debe contener letras" });
      }
      if (apellido && !soloLetrasRegex.test(apellido)) {
        return res.status(400).json({ error: "El apellido solo debe contener letras" });
      }
      if (dni && !dniRegex.test(dni)) {
        return res.status(400).json({ error: "El DNI debe tener exactamente 8 dígitos numéricos" });
      }
      if (telefono && !telefonoRegex.test(telefono)) {
        return res.status(400).json({ error: "El teléfono debe tener entre 7 y 9 dígitos numéricos" });
      }
      if (genero && !generoOpciones.includes(genero.toLowerCase())) {
        return res.status(400).json({ error: "El género solo puede ser masculino o femenino" });
      }
      usuario.ruc = null;
    } else if (rolUsuario === "corporativo") {
      // Obligatorios: nombre, telefono, direccion, email, ruc
      if (
        (nombre !== undefined && !nombre) ||
        (telefono !== undefined && !telefono) ||
        (direccion !== undefined && !direccion) ||
        (email !== undefined && !email) ||
        (ruc !== undefined && !ruc)
      ) {
        return res.status(400).json({ error: "Todos los campos son obligatorios para corporativo excepto foto_perfil" });
      }
      if (nombre && !soloLetrasRegex.test(nombre)) {
        return res.status(400).json({ error: "El nombre solo debe contener letras" });
      }
      if (ruc && !rucRegex.test(ruc)) {
        return res.status(400).json({ error: "El RUC debe tener exactamente 11 dígitos numéricos" });
      }
      if (telefono && !telefonoRegex.test(telefono)) {
        return res.status(400).json({ error: "El teléfono debe tener entre 7 y 9 dígitos numéricos" });
      }
      dni = undefined;
      apellido = undefined;
      fecha_nacimiento = undefined;
      genero = undefined;
    } else if (rolUsuario === "admin") {
      // Obligatorios: nombre, email
      if (
        (nombre !== undefined && !nombre) ||
        (email !== undefined && !email)
      ) {
        return res.status(400).json({ error: "Nombre y email son obligatorios para admin" });
      }
      if (nombre && !soloLetrasRegex.test(nombre)) {
        return res.status(400).json({ error: "El nombre solo debe contener letras" });
      }
      dni = undefined;
      ruc = undefined;
      apellido = undefined;
      fecha_nacimiento = undefined;
      genero = undefined;
    }

    // Si se envía email, validar formato y duplicados
    if (email) {
      const emailTrim = email.trim().toLowerCase();
      if (!emailRegex.test(emailTrim)) {
        return res.status(400).json({ error: "El formato del correo es inválido" });
      }
      const existe = await Usuario.findOne({ where: { email: emailTrim } });
      if (existe && existe.id !== usuario.id) {
        return res.status(409).json({ error: "El email ya está registrado" });
      }
      usuario.email = emailTrim;
    }
    if (nombre) usuario.nombre = nombre.trim();
    if (apellido !== undefined) usuario.apellido = apellido ? apellido.trim() : null;
    if (telefono !== undefined) usuario.telefono = telefono ? telefono.trim() : null;
    if (direccion !== undefined) usuario.direccion = direccion ? direccion.trim() : null;
    if (fecha_nacimiento !== undefined) usuario.fecha_nacimiento = fecha_nacimiento || null;
    if (genero !== undefined) usuario.genero = genero ? genero.trim() : null;
    if (foto_perfil !== undefined) usuario.foto_perfil = foto_perfil ? foto_perfil.trim() : null;
    if (estado !== undefined) usuario.estado = estado ? estado.trim() : usuario.estado;
    if (dni !== undefined) {
      if (dni && !dniRegex.test(dni)) {
        return res.status(400).json({ error: "El DNI debe tener exactamente 8 dígitos numéricos" });
      }
      // Unicidad de dni
      if (dni) {
        const existeDni = await Usuario.findOne({ where: { dni } });
        if (existeDni && existeDni.id !== usuario.id) {
          return res.status(409).json({ error: "El DNI ya está registrado" });
        }
      }
      usuario.dni = dni ? dni.trim() : null;
    }
    if (ruc !== undefined) {
      if (ruc && !rucRegex.test(ruc)) {
        return res.status(400).json({ error: "El RUC debe tener exactamente 11 dígitos numéricos" });
      }
      // Unicidad de ruc
      if (ruc) {
        const existeRuc = await Usuario.findOne({ where: { ruc } });
        if (existeRuc && existeRuc.id !== usuario.id) {
          return res.status(409).json({ error: "El RUC ya está registrado" });
        }
      }
      usuario.ruc = ruc ? ruc.trim() : null;
    }

    // Si se envía password, validar longitud y encriptar
    if (password) {
      if (typeof password !== "string" || password.length < 8 || password.length > 16) {
        return res.status(400).json({ error: "La contraseña debe tener entre 8 y 16 caracteres" });
      }
      usuario.password = password;
    }

    // Si se envía rol, solo admin puede cambiarlo
    if (rol) {
      const rolesPermitidos = ["cliente", "admin", "corporativo"];
      if (!rolesPermitidos.includes(rol)) {
        return res.status(400).json({ error: "Rol inválido" });
      }
      if (req.user.rol !== "admin") {
        return res
          .status(403)
          .json({ error: "No tienes permiso para cambiar el rol" });
      }
      usuario.rol = rol;
    }

    await usuario.save();

    res.json({
      mensaje: "Usuario actualizado correctamente",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        fecha_nacimiento: usuario.fecha_nacimiento,
        genero: usuario.genero,
        foto_perfil: usuario.foto_perfil,
        estado: usuario.estado,
        dni: usuario.dni,
        ruc: usuario.ruc,
        email: usuario.email,
        rol: usuario.rol,
        fecha_registro: usuario.fecha_registro,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

// 📌 Eliminar usuario (admin o el propio usuario)
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Solo admin o el propio usuario
    if (req.user.rol !== "admin" && req.user.id !== parseInt(id)) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar este usuario" });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario.estado === "inactivo") {
      return res.status(400).json({ error: "El usuario ya está inactivo" });
    }

    usuario.estado = "inactivo";
    await usuario.save();

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};
