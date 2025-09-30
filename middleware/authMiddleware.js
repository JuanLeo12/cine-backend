const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

// 📌 Autenticación
exports.autenticarUsuario = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado o formato inválido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: ["id", "nombre", "email", "rol", "estado", "token_version"],
    });
    if (!usuario || usuario.estado !== "activo") {
      return res.status(401).json({ error: "Usuario no autorizado o inactivo" });
    }

    // 🔒 Comparar token_version
    if (decoded.tokenVersion !== usuario.token_version) {
      return res.status(401).json({ error: "Token inválido, inicie sesión nuevamente" });
    }

    req.user = usuario;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }
    return res.status(401).json({ error: "Token inválido" });
  }
};

// 📌 Roles
exports.permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: "No tienes permisos para acceder a este recurso" });
    }
    next();
  };
};

exports.soloAdmin = exports.permitirRoles("admin");
exports.soloCorporativo = exports.permitirRoles("corporativo");
