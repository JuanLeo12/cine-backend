const express = require('express');
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');
const {
  listarSalas,
  obtenerSala,
  crearSala,
  actualizarSala,
  eliminarSala
} = require('../controllers/salasController');

// 📌 Listar salas → público
router.get('/', listarSalas);

// 📌 Obtener sala por ID → público
router.get('/:id', obtenerSala);

// 📌 Crear sala → solo admin
router.post('/', autenticarUsuario, permitirRoles('admin'), crearSala);

// 📌 Actualizar sala → solo admin
router.put('/:id', autenticarUsuario, permitirRoles('admin'), actualizarSala);

// 📌 Eliminar sala → solo admin
router.delete('/:id', autenticarUsuario, permitirRoles('admin'), eliminarSala);

module.exports = router;