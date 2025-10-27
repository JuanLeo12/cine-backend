const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  permitirRoles,
} = require("../middleware/authMiddleware");
const {
  listarVales,
  crearVale,
  obtenerVale,
  actualizarVale,
  eliminarVale,
  validarValeCodigo,
} = require("../controllers/valesCorporativosController");

// 📍 Listar vales → admin y corporativo
router.get(
  "/",
  autenticarUsuario,
  permitirRoles("admin", "corporativo"),
  listarVales
);

// 📍 Validar vale por código → cualquier usuario autenticado
router.get("/validar/:codigo", autenticarUsuario, validarValeCodigo);

// 📍 Crear vale → corporativo y admin
router.post(
  "/",
  autenticarUsuario,
  permitirRoles("corporativo", "admin"),
  crearVale
);

// 📍 Obtener vale por ID → admin o dueño
router.get("/:id", autenticarUsuario, obtenerVale);

// 📍 Actualizar vale → corporativo o admin
router.put(
  "/:id",
  autenticarUsuario,
  permitirRoles("corporativo", "admin"),
  actualizarVale
);

// 📍 Eliminar vale → solo admin
router.delete("/:id", autenticarUsuario, permitirRoles("admin"), eliminarVale);

module.exports = router;
