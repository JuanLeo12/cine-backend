const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  permitirRoles,
} = require("../middleware/authMiddleware");
const {
  listarTarifas,
  crearTarifa,
  eliminarTarifa,
} = require("../controllers/tarifasCorporativasController");

// 📍 Listar tarifas → admin y corporativo
router.get(
  "/",
  autenticarUsuario,
  permitirRoles("admin", "corporativo"),
  listarTarifas
);

// 📍 Crear tarifa → admin y corporativo
router.post(
  "/",
  autenticarUsuario,
  permitirRoles("admin", "corporativo"),
  crearTarifa
);

// 📍 Eliminar tarifa → admin o dueño
router.delete(
  "/:id",
  autenticarUsuario,
  permitirRoles("admin", "corporativo"),
  eliminarTarifa
);

module.exports = router;
