const express = require('express');
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');
const {
  listarAsientos,
  reservarAsiento,
  eliminarAsiento
} = require('../controllers/asientosFuncionController');

// 📌 Listar asientos → admin y corporativo (puedes ampliar a 'cliente' si quieres)
router.get('/', autenticarUsuario, permitirRoles('admin', 'corporativo'), listarAsientos);

// 📌 Reservar asiento → cualquier usuario autenticado
router.post('/', autenticarUsuario, reservarAsiento);

// 📌 Eliminar asiento → solo admin (o validar en controlador si es el dueño de la reserva)
router.delete('/:id', autenticarUsuario, permitirRoles('admin'), eliminarAsiento);

module.exports = router;