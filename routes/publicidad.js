const express = require("express");
const router = express.Router();
const publicidadController = require("../controllers/publicidadController");
const upload = require("../middleware/upload");
const {
  autenticarUsuario,
  soloAdmin,
  soloCorporativo,
} = require("../middleware/authMiddleware");

// 📍 Público: campañas activas y visibles
router.get("/activas", publicidadController.listarPublicidadActiva);

// 📍 Todas las demás requieren login
router.use(autenticarUsuario);

// 📍 Crear (solo corporativo) - CON UPLOAD DE ARCHIVO
router.post("/", soloCorporativo, upload.single('archivo'), publicidadController.crearPublicidad);

// 📍 Listar (admin ve todas, corporativo solo las suyas)
router.get("/", publicidadController.listarPublicidad);

// 📍 Pendientes (solo admin) - MOVER ANTES DE /:id
router.get(
  "/pendientes",
  soloAdmin,
  publicidadController.listarPublicidadPendiente
);

// 📍 Descargar archivo (admin o dueño)
router.get("/:id/descargar", publicidadController.descargarArchivo);

// 📍 Obtener por ID (admin o dueño)
router.get("/:id", publicidadController.obtenerPublicidad);

// 📍 Eliminar (admin o dueño)
router.delete("/:id", publicidadController.eliminarPublicidad);

// 📍 Aprobar (solo admin)
router.put("/:id/aprobar", soloAdmin, publicidadController.aprobarPublicidad);

module.exports = router;
