const express = require("express");
const router = express.Router();
const publicidadController = require("../controllers/publicidadController");
const {
  autenticarUsuario,
  soloAdmin,
  soloCorporativo,
} = require("../middleware/authMiddleware");

// 📍 Público: campañas activas y visibles
router.get("/activas", publicidadController.listarPublicidadActiva);

// 📍 Todas las demás requieren login
router.use(autenticarUsuario);

// 📍 Crear (solo corporativo)
router.post("/", soloCorporativo, publicidadController.crearPublicidad);

// 📍 Listar (admin ve todas, corporativo solo las suyas)
router.get("/", publicidadController.listarPublicidad);

// 📍 Eliminar (admin o dueño)
router.delete("/:id", publicidadController.eliminarPublicidad);

// 📍 Aprobar (solo admin)
router.put("/:id/aprobar", soloAdmin, publicidadController.aprobarPublicidad);

// 📍 Pendientes (solo admin)
router.get(
  "/pendientes",
  soloAdmin,
  publicidadController.listarPublicidadPendiente
);

module.exports = router;
