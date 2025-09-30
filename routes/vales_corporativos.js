const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  permitirRoles,
} = require("../middleware/authMiddleware");
const {
  listarVales,
  crearVale,
  eliminarVale,
} = require("../controllers/valesCorporativosController");

// 📍 Listar vales → admin y corporativo
router.get(
  "/",
  autenticarUsuario,
  permitirRoles("admin", "corporativo"),
  listarVales
);

// 📍 Crear vale → corporativo y admin
router.post(
  "/",
  autenticarUsuario,
  permitirRoles("corporativo", "admin"),
  crearVale
);

// 📍 Eliminar vale → solo admin
router.delete("/:id", autenticarUsuario, permitirRoles("admin"), eliminarVale);

module.exports = router;
