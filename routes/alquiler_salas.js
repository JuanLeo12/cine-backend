const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  permitirRoles,
} = require("../middleware/authMiddleware");
const {
  listarAlquileres,
  crearAlquiler,
  eliminarAlquiler,
} = require("../controllers/alquilerSalasController");

// 📍 Listar → admin ve todos, corporativo solo los suyos
router.get(
  "/",
  autenticarUsuario,
  permitirRoles("admin", "corporativo"),
  listarAlquileres
);

// 📍 Crear → corporativo y admin
router.post(
  "/",
  autenticarUsuario,
  permitirRoles("corporativo", "admin"),
  crearAlquiler
);

// 📍 Eliminar → admin o dueño (validación en controlador)
router.delete("/:id", autenticarUsuario, eliminarAlquiler);

module.exports = router;
