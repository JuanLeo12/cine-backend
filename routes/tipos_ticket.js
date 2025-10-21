const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  permitirRoles,
} = require("../middleware/authMiddleware");
const {
  listarTipos,
  obtenerTipo,
  crearTipo,
  actualizarTipo,
  eliminarTipo,
} = require("../controllers/tiposTicketController");

// 📍 Públicos
router.get("/", listarTipos);
router.get("/:id", obtenerTipo);

// 📍 Solo admin
router.post("/", autenticarUsuario, permitirRoles("admin"), crearTipo);
router.put("/:id", autenticarUsuario, permitirRoles("admin"), actualizarTipo);
router.delete("/:id", autenticarUsuario, permitirRoles("admin"), eliminarTipo);

module.exports = router;
