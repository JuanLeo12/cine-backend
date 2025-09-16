const express = require('express');
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');
const {
  listarTipos,
  obtenerTipo,
  crearTipo,
  actualizarTipo,
  eliminarTipo
} = require('../controllers/tiposUsuarioController');

// 📌 Listar tipos de usuario → solo admin
router.get('/', autenticarUsuario, permitirRoles('admin'), listarTipos);

// 📌 Obtener tipo de usuario por ID → solo admin
router.get('/:id', autenticarUsuario, permitirRoles('admin'), obtenerTipo);

// 📌 Crear tipo de usuario → solo admin
router.post('/', autenticarUsuario, permitirRoles('admin'), crearTipo);

// 📌 Actualizar tipo de usuario → solo admin
router.put('/:id', autenticarUsuario, permitirRoles('admin'), actualizarTipo);

// 📌 Eliminar tipo de usuario → solo admin
router.delete('/:id', autenticarUsuario, permitirRoles('admin'), eliminarTipo);

module.exports = router;