const express = require('express');
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');
const {
  listarTarifas,
  crearTarifa,
  eliminarTarifa
} = require('../controllers/tarifasCorporativasController');

// 📌 Listar tarifas → admin y corporativo
router.get('/', autenticarUsuario, permitirRoles('admin', 'corporativo'), listarTarifas);

// 📌 Crear tarifa → solo admin
router.post('/', autenticarUsuario, permitirRoles('admin'), crearTarifa);

// 📌 Eliminar tarifa → solo admin
router.delete('/:id', autenticarUsuario, permitirRoles('admin'), eliminarTarifa);

module.exports = router;