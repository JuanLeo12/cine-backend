const express = require('express');
const router = express.Router();
const { autenticarUsuario } = require('../middleware/authMiddleware');
const {
  listarTickets,
  obtenerTicket,
  crearTicket,
  eliminarTicket
} = require('../controllers/ticketsController');

// 📌 Listar tickets → admin ve todos, otros solo los suyos (filtrado en controlador)
router.get('/', autenticarUsuario, listarTickets);

// 📌 Obtener ticket por ID → admin cualquier ticket, otros solo los suyos (validación en controlador)
router.get('/:id', autenticarUsuario, obtenerTicket);

// 📌 Crear ticket → cualquier usuario autenticado
router.post('/', autenticarUsuario, crearTicket);

// 📌 Eliminar ticket → admin o dueño del ticket (validación en controlador)
router.delete('/:id', autenticarUsuario, eliminarTicket);

module.exports = router;