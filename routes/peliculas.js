const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  permitirRoles,
} = require("../middleware/authMiddleware");
const { validarPelicula } = require("../utils/validacionesPeliculas");
const {
  listarPeliculas,
  obtenerPelicula,
  crearPelicula,
  actualizarPelicula,
  eliminarPelicula,
} = require("../controllers/peliculasController");

/**
 * 🎬 Rutas de Películas
 *
 * 🔹 Rutas públicas:
 *   GET /peliculas               → Lista todas las películas activas
 *     Parámetros opcionales (query):
 *       - tipo: "cartelera" | "proxEstreno"
 *       - genero: string (búsqueda parcial, insensible a mayúsculas)
 *       - clasificacion: string (ej: "PG-13", "R")
 *
 *   GET /peliculas/:id           → Obtener una película por ID
 *
 * 🔹 Rutas solo para administrador:
 *   POST   /peliculas            → Crear nueva película
 *   PATCH  /peliculas/:id        → Actualizar película
 *   DELETE /peliculas/:id        → Inactivar película (soft delete)
 */

// -------------------------------
// 📌 Rutas públicas
// -------------------------------
router.get("/", listarPeliculas); // Soporta filtros dinámicos por query
router.get("/:id", obtenerPelicula);

// -------------------------------
// 🔒 Rutas para administrador
// -------------------------------
router.post(
  "/",
  autenticarUsuario,
  permitirRoles("admin"),
  validarPelicula,
  crearPelicula
);

router.patch(
  "/:id",
  autenticarUsuario,
  permitirRoles("admin"),
  validarPelicula,
  actualizarPelicula
);

router.delete(
  "/:id",
  autenticarUsuario,
  permitirRoles("admin"),
  eliminarPelicula
);

module.exports = router;
