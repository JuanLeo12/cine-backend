const express = require('express');
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');
const {
  listarTickets,
  crearTicket,
  eliminarTicket
} = require('../controllers/ordenesTicketsController');

// 📌 Listar órdenes de tickets → admin ve todas, otros solo las suyas (filtrado en controlador)
router.get('/', autenticarUsuario, listarTickets);

// 📌 Crear orden de ticket → cualquier usuario autenticado
router.post('/', autenticarUsuario, crearTicket);

// 📌 Eliminar orden de ticket → admin o dueño de la orden (validación en controlador)
router.delete('/:id', autenticarUsuario, eliminarTicket);

module.exports = router;