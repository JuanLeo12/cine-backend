const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

// 📌 Middleware para verificar autenticación
exports.autenticarUsuario = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Token no proporcionado o formato inválido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Opcional: verificar que el usuario exista y esté activo
    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: ["id", "nombre", "email", "rol"],
    });
    if (!usuario) {
      return res
        .status(401)
        .json({ error: "Usuario no encontrado o inactivo" });
    }

    req.user = usuario; // Guardamos el usuario completo
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }
    return res.status(401).json({ error: "Token inválido" });
  }
};

// 📌 Middleware genérico para roles
exports.permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para acceder a este recurso" });
    }
    next();
  };
};

// 📌 Alias para roles específicos
exports.soloAdmin = exports.permitirRoles("admin");
exports.soloCorporativo = exports.permitirRoles("corporativo");
