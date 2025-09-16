const express = require('express');
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require('../middleware/authMiddleware');
const {
  listarPeliculas,
  obtenerPelicula,
  crearPelicula,
  actualizarPelicula,
  eliminarPelicula
} = require('../controllers/peliculasController');

// 📌 Listar películas → público
router.get('/', listarPeliculas);

// 📌 Obtener película por ID → público
router.get('/:id', obtenerPelicula);

// 📌 Crear película → solo admin
router.post('/', autenticarUsuario, permitirRoles('admin'), crearPelicula);

// 📌 Actualizar película → solo admin
router.put('/:id', autenticarUsuario, permitirRoles('admin'), actualizarPelicula);

// 📌 Eliminar película → solo admin
router.delete('/:id', autenticarUsuario, permitirRoles('admin'), eliminarPelicula);

module.exports = router;