const express = require('express');
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');
const {
  listarAlquileres,
  crearAlquiler,
  eliminarAlquiler
} = require('../controllers/alquilerSalasController');

// 📌 Listar alquileres → admin y corporativo
router.get('/', autenticarUsuario, permitirRoles('admin', 'corporativo'), listarAlquileres);

// 📌 Crear alquiler → corporativo (y admin opcionalmente)
router.post('/', autenticarUsuario, permitirRoles('corporativo', 'admin'), crearAlquiler);

// 📌 Eliminar alquiler → solo admin
router.delete('/:id', autenticarUsuario, permitirRoles('admin'), eliminarAlquiler);

module.exports = router;