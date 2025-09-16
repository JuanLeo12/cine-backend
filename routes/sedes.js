const express = require('express');
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');
const {
  listarSedes,
  obtenerSede,
  crearSede,
  actualizarSede,
  eliminarSede
} = require('../controllers/sedesController');

// 📌 Listar sedes → público
router.get('/', listarSedes);

// 📌 Obtener sede por ID → público
router.get('/:id', obtenerSede);

// 📌 Crear sede → solo admin
router.post('/', autenticarUsuario, permitirRoles('admin'), crearSede);

// 📌 Actualizar sede → solo admin
router.put('/:id', autenticarUsuario, permitirRoles('admin'), actualizarSede);

// 📌 Eliminar sede → solo admin
router.delete('/:id', autenticarUsuario, permitirRoles('admin'), eliminarSede);

module.exports = router;