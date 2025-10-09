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

// -------------------------------
// Rutas públicas
// -------------------------------
router.get("/", listarPeliculas); // Soporta filtros: ?tipo=cartelera&genero=Acción&clasificacion=PG-13
router.get("/:id", obtenerPelicula);

// -------------------------------
// Rutas protegidas (solo admin)
// -------------------------------
router.post(
  "/",
  autenticarUsuario,
  permitirRoles("admin"),
  validarPelicula,
  crearPelicula
);

router.put(
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
