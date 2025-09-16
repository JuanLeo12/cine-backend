const express = require('express');
const router = express.Router();
const publicidadController = require('../controllers/publicidadController');
const { autenticarUsuario, soloAdmin, soloCorporativo } = require('../middleware/authMiddleware');

// 📍 Listar campañas activas y visibles (frontend web) → público
router.get('/activas', publicidadController.listarPublicidadActiva);

// 📌 A partir de aquí, todas requieren autenticación
router.use(autenticarUsuario);

// 📍 Crear nueva campaña (solo cliente corporativo)
router.post('/', soloCorporativo, publicidadController.crearPublicidad);

// 📍 Obtener todas las campañas (solo admin)
router.get('/', soloAdmin, publicidadController.listarPublicidad);

// 📍 Eliminar campaña (solo admin)
router.delete('/:id', soloAdmin, publicidadController.eliminarPublicidad);

// 📍 Aprobar campaña (solo admin)
router.put('/:id/aprobar', soloAdmin, publicidadController.aprobarPublicidad);

// 📍 Listar campañas pendientes (solo admin)
router.get('/pendientes', soloAdmin, publicidadController.listarPublicidadPendiente);

module.exports = router;