const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  soloAdmin,
} = require("../middleware/authMiddleware");
const {
  listarTipos,
  obtenerTipo,
  crearTipo,
  actualizarTipo,
  eliminarTipo,
} = require("../controllers/tiposUsuarioController");

router.get("/", listarTipos);
router.get("/:id", obtenerTipo);
router.post("/", autenticarUsuario, soloAdmin, crearTipo);
router.put("/:id", autenticarUsuario, soloAdmin, actualizarTipo);
router.delete("/:id", autenticarUsuario, soloAdmin, eliminarTipo);

module.exports = router;
