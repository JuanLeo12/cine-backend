const express = require('express');
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');
const {
  listarCombos,
  crearCombo,
  eliminarCombo
} = require('../controllers/ordenesCombosController');

// 📌 Listar órdenes de combos → admin (y opcionalmente corporativo)
router.get('/', autenticarUsuario, permitirRoles('admin'), listarCombos);

// 📌 Crear orden de combo → cualquier usuario autenticado
router.post('/', autenticarUsuario, crearCombo);

// 📌 Eliminar orden de combo → solo admin
router.delete('/:id', autenticarUsuario, permitirRoles('admin'), eliminarCombo);

module.exports = router;