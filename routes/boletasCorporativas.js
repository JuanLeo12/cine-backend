const express = require('express');
const router = express.Router();
const {
  crearBoletaCorporativa,
  obtenerBoletaPorQR,
  marcarBoletaUtilizada,
  obtenerMisBoletas,
  obtenerTodasBoletasAdmin
} = require('../controllers/boletasCorporativasController');
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');

// Rutas protegidas
router.post('/', autenticarUsuario, permitirRoles('corporativo', 'cliente', 'admin'), crearBoletaCorporativa); // Crear boleta (corporativos: todos, clientes: solo funciones privadas)
router.get('/mis-boletas', autenticarUsuario, permitirRoles('corporativo', 'cliente', 'admin'), obtenerMisBoletas); // Mis boletas (corporativos: todos, clientes: solo funciones privadas)
router.get('/admin/todas', autenticarUsuario, permitirRoles('admin'), obtenerTodasBoletasAdmin); // Admin: todas las boletas
router.get('/:codigo_qr', obtenerBoletaPorQR); // Obtener por QR (público para validar)
router.put('/:codigo_qr/utilizar', autenticarUsuario, marcarBoletaUtilizada); // Marcar como utilizada

module.exports = router;
