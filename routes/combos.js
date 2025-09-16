const express = require('express');
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');
const {
  listarCombos,
  obtenerCombo,
  crearCombo,
  actualizarCombo,
  eliminarCombo
} = require('../controllers/combosController');

// 📌 Listar combos → público
router.get('/', listarCombos);

// 📌 Obtener combo por ID → público
router.get('/:id', obtenerCombo);

// 📌 Crear combo → solo admin
router.post('/', autenticarUsuario, permitirRoles('admin'), crearCombo);

// 📌 Actualizar combo → solo admin
router.put('/:id', autenticarUsuario, permitirRoles('admin'), actualizarCombo);

// 📌 Eliminar combo → solo admin
router.delete('/:id', autenticarUsuario, permitirRoles('admin'), eliminarCombo);

module.exports = router;