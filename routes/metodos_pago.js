const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  permitirRoles,
} = require("../middleware/authMiddleware");
const {
  listarMetodos,
  obtenerMetodo,
  crearMetodo,
  actualizarMetodo,
  eliminarMetodo,
} = require("../controllers/metodosPagoController");

// 📌 Listar métodos de pago → público
router.get("/", listarMetodos);

// 📌 Obtener método de pago por ID → público
router.get("/:id", obtenerMetodo);

// 📌 Crear método de pago → solo admin
router.post("/", autenticarUsuario, permitirRoles("admin"), crearMetodo);

// 📌 Actualizar método de pago → solo admin
router.put("/:id", autenticarUsuario, permitirRoles("admin"), actualizarMetodo);

// 📌 Eliminar método de pago → solo admin
router.delete(
  "/:id",
  autenticarUsuario,
  permitirRoles("admin"),
  eliminarMetodo
);

module.exports = router;