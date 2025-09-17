const express = require('express');
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');
const usuariosController = require('../controllers/usuariosController');

// Registro de usuario (público)
router.post('/registro', usuariosController.registrarUsuario);

// Login de usuario (público)
router.post('/login', usuariosController.loginUsuario);

// Perfil autenticado
router.get('/perfil', autenticarUsuario, usuariosController.obtenerPerfil);

// Listado general de usuarios (solo admin)
router.get('/', autenticarUsuario, permitirRoles('admin'), usuariosController.listarUsuarios);

// Actualizar usuario (admin o el propio usuario)
router.put('/:id', autenticarUsuario, usuariosController.actualizarUsuario);

// Eliminar usuario (admin o el propio usuario)
router.delete('/:id', autenticarUsuario, usuariosController.eliminarUsuario);

module.exports = router;