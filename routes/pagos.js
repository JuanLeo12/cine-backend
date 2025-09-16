const express = require('express');
const router = express.Router();
const { autenticarUsuario } = require('../middleware/authMiddleware');
const {
  listarPagos,
  obtenerPago,
  crearPago
} = require('../controllers/pagosController');

// 📌 Listar pagos → admin ve todos, otros solo los suyos (filtrado en controlador)
router.get('/', autenticarUsuario, listarPagos);

// 📌 Obtener pago por ID → admin cualquier pago, otros solo los suyos (validación en controlador)
router.get('/:id', autenticarUsuario, obtenerPago);

// 📌 Crear pago → cualquier usuario autenticado
router.post('/', autenticarUsuario, crearPago);

module.exports = router;