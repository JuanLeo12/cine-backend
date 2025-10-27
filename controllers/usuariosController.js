const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { Usuario } = require("../models");
const { validarCamposPorRol } = require("../utils/validacionesUsuario");

// 📌 Registro
exports.registrarUsuario = async (req, res) => {
  try {
    let { rol, ...data } = req.body;
    const rolUsuario = rol || "cliente";

    const errores = validarCamposPorRol(rolUsuario, data);
    if (errores.length > 0) return res.status(400).json({ errores });

    // Unicidad
    if (data.email && (await Usuario.findOne({ where: { email: data.email } })))
      return res.status(409).json({ error: "El email ya está registrado" });
    if (data.dni && (await Usuario.findOne({ where: { dni: data.dni } })))
      return res.status(409).json({ error: "El DNI ya está registrado" });
    if (data.ruc && (await Usuario.findOne({ where: { ruc: data.ruc } })))
      return res.status(409).json({ error: "El RUC ya está registrado" });

    const rolesPermitidos = ["cliente", "admin", "corporativo"];
    if (!rolesPermitidos.includes(rolUsuario))
      return res.status(400).json({ error: "Rol inválido" });

    if (rolUsuario === "admin" && (!req.user || req.user.rol !== "admin")) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para asignar el rol admin" });
    }

    const nuevoUsuario = await Usuario.create({ ...data, rol: rolUsuario });
    res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario: nuevoUsuario,
    });
  } catch (error) {
    console.error("Error en registrarUsuario:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

// 📌 Login
exports.loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });

    const usuario = await Usuario.scope("withPassword").findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!usuario || !(await usuario.validarPassword(password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (usuario.estado !== "activo") {
      return res
        .status(403)
        .json({ error: "Cuenta inactiva, no puede iniciar sesión" });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, tokenVersion: usuario.token_version },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ mensaje: "Login exitoso", token, usuario });
  } catch (error) {
    console.error("Error en loginUsuario:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

// 📌 Perfil
exports.obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.user.id);
    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    console.error("Error en obtenerPerfil:", error);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
};

// 📌 Actualizar perfil del usuario autenticado
exports.actualizarPerfil = async (req, res) => {
  try {
    const id = req.user.id;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    let { rol, ...data } = req.body;
    const rolUsuario = rol || usuario.rol;

    // validar campos según rol actual (no permitimos cambiar rol aquí salvo admin)
    const errores = validarCamposPorRol(
      rolUsuario,
      {
        ...usuario.toJSON(),
        ...data,
      },
      true
    );
    if (errores.length > 0) return res.status(400).json({ errores });

    if (
      data.email &&
      (await Usuario.findOne({ where: { email: data.email, id: { [Op.ne]: usuario.id } } }))
    )
      return res.status(409).json({ error: "El email ya está registrado" });

    if (
      data.dni &&
      (await Usuario.findOne({ where: { dni: data.dni, id: { [Op.ne]: usuario.id } } }))
    )
      return res.status(409).json({ error: "El DNI ya está registrado" });

    if (
      data.ruc &&
      (await Usuario.findOne({ where: { ruc: data.ruc, id: { [Op.ne]: usuario.id } } }))
    )
      return res.status(409).json({ error: "El RUC ya está registrado" });

    // No permitir que un usuario se asigne rol admin desde perfil
    if (rol && req.user.rol !== "admin") {
      return res.status(403).json({ error: "No tienes permiso para cambiar el rol" });
    }

    await usuario.update({ ...data, rol: rolUsuario });
    res.json({ mensaje: "Perfil actualizado correctamente", usuario });
  } catch (error) {
    console.error("Error en actualizarPerfil:", error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
};

// 📌 Listado
exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      order: [["fecha_registro", "DESC"]],
    });
    res.json(usuarios);
  } catch (error) {
    console.error("Error en listarUsuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// 📌 Actualizar
exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.rol !== "admin" && req.user.id !== parseInt(id)) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar este usuario" });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });

    let { rol, ...data } = req.body;
    const rolUsuario = rol || usuario.rol;

    const errores = validarCamposPorRol(
      rolUsuario,
      {
        ...usuario.toJSON(),
        ...data,
      },
      true
    );
    if (errores.length > 0) return res.status(400).json({ errores });

    if (
      data.email &&
      (await Usuario.findOne({
        where: { email: data.email, id: { [Op.ne]: usuario.id } },
      }))
    )
      return res.status(409).json({ error: "El email ya está registrado" });

    if (
      data.dni &&
      (await Usuario.findOne({
        where: { dni: data.dni, id: { [Op.ne]: usuario.id } },
      }))
    )
      return res.status(409).json({ error: "El DNI ya está registrado" });

    if (
      data.ruc &&
      (await Usuario.findOne({
        where: { ruc: data.ruc, id: { [Op.ne]: usuario.id } },
      }))
    )
      return res.status(409).json({ error: "El RUC ya está registrado" });

    if (rol && req.user.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para cambiar el rol" });
    }

    await usuario.update({ ...data, rol: rolUsuario });
    res.json({ mensaje: "Usuario actualizado correctamente", usuario });
  } catch (error) {
    console.error("Error en actualizarUsuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

// 📌 Eliminar (soft delete + invalida tokens)
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.rol !== "admin" && req.user.id !== parseInt(id)) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar este usuario" });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });
    if (usuario.estado === "inactivo")
      return res.status(400).json({ error: "El usuario ya está inactivo" });

    usuario.estado = "inactivo";
    usuario.token_version += 1; // 🔑 invalida tokens anteriores
    await usuario.save();

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error en eliminarUsuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};
