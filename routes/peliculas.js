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

// 📌 Público
router.get("/", listarPeliculas);
router.get("/:id", obtenerPelicula);

// 📌 Admin
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
