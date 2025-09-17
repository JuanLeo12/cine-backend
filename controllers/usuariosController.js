const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

// 📌 Registro de usuario
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

    if (!nombre || !email || !password) {
      return res
        .status(400)
        .json({ error: "Nombre, email y contraseña son obligatorios" });
    }

    // Validar dni/ruc según rol
    const rolUsuario = rol || "cliente";
    if (rolUsuario === "cliente" && !dni) {
      return res.status(400).json({ error: "El campo DNI es obligatorio para clientes" });
    }
    if (rolUsuario === "corporativo" && !ruc) {
      return res.status(400).json({ error: "El campo RUC es obligatorio para usuarios corporativos" });
    }

    email = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: "El formato del correo es inválido" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    if (dni) {
      const existeDni = await Usuario.findOne({ where: { dni } });
      if (existeDni) {
        return res.status(409).json({ error: "El DNI ya está registrado" });
      }
    }
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
    if (rol && rol !== "cliente" && (!req.user || req.user.rol !== "admin")) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para asignar este rol" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      apellido: apellido ? apellido.trim() : null,
      telefono: telefono ? telefono.trim() : null,
      direccion: direccion ? direccion.trim() : null,
      fecha_nacimiento: fecha_nacimiento || null,
      genero: genero ? genero.trim() : null,
      foto_perfil: foto_perfil ? foto_perfil.trim() : null,
      estado: estado ? estado.trim() : undefined,
      dni: dni ? dni.trim() : null,
      ruc: ruc ? ruc.trim() : null,
      email,
      password: hashedPassword,
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

// 📌 Login de usuario
exports.loginUsuario = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });
    }

    email = email.trim().toLowerCase();

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
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

// 📌 Perfil autenticado
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

// 📌 Listado general de usuarios (solo admin)
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

    // Si se envía email, validar formato y duplicados
    if (email) {
      const emailTrim = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrim)) {
        return res
          .status(400)
          .json({ error: "El formato del correo es inválido" });
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
  if (dni !== undefined) usuario.dni = dni ? dni.trim() : null;
  if (ruc !== undefined) usuario.ruc = ruc ? ruc.trim() : null;

    // Si se envía password, validar longitud y encriptar
    if (password) {
      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "La contraseña debe tener al menos 8 caracteres" });
      }
      usuario.password = await bcrypt.hash(password, 10);
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

    await usuario.destroy();

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};
