const express = require('express');
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');
const {
  listarFunciones,
  obtenerFuncion,
  crearFuncion,
  actualizarFuncion,
  eliminarFuncion
} = require('../controllers/funcionesController');

// 📌 Listar funciones → público
router.get('/', listarFunciones);

// 📌 Obtener función por ID → público
router.get('/:id', obtenerFuncion);

// 📌 Crear función → solo admin
router.post('/', autenticarUsuario, permitirRoles('admin'), crearFuncion);

// 📌 Actualizar función → solo admin
router.put('/:id', autenticarUsuario, permitirRoles('admin'), actualizarFuncion);

// 📌 Eliminar función → solo admin
router.delete('/:id', autenticarUsuario, permitirRoles('admin'), eliminarFuncion);

module.exports = router;