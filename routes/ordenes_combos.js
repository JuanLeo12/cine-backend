const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  permitirRoles,
} = require("../middleware/authMiddleware");
const {
  listarCombos,
  crearCombo,
  eliminarCombo,
} = require("../controllers/ordenesCombosController");

// 📌 Listar combos de orden → admin ve todos, usuarios solo los suyos
router.get("/", autenticarUsuario, listarCombos);

// 📌 Crear combo en orden → cualquier usuario autenticado
router.post("/", autenticarUsuario, crearCombo);

// 📌 Eliminar combo de orden → admin o dueño de la orden (controlador valida)
router.delete("/:id", autenticarUsuario, eliminarCombo);

module.exports = router;
