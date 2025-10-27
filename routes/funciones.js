const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  permitirRoles,
} = require("../middleware/authMiddleware");
const { validarFuncion } = require("../utils/validacionesFunciones");

const {
  listarFunciones,
  listarTodasFunciones,
  obtenerFuncion,
  obtenerFuncionesByPelicula,
  crearFuncion,
  actualizarFuncion,
  eliminarFuncion,
  desactivarFuncionesPasadas,
  desactivarFuncion,
} = require("../controllers/funcionesController");

// 📌 Público
router.get("/", listarFunciones);
router.get("/pelicula/:id_pelicula", obtenerFuncionesByPelicula);
router.get("/:id", obtenerFuncion);

// 📌 Admin - Gestión funciones
router.get(
  "/admin/todas",
  autenticarUsuario,
  permitirRoles("admin"),
  listarTodasFunciones
);
router.post(
  "/admin/desactivar-pasadas",
  autenticarUsuario,
  permitirRoles("admin"),
  desactivarFuncionesPasadas
);
router.patch(
  "/:id/desactivar",
  autenticarUsuario,
  permitirRoles("admin"),
  desactivarFuncion
);
router.post(
  "/",
  autenticarUsuario,
  permitirRoles("admin"),
  validarFuncion,
  crearFuncion
);
router.put(
  "/:id",
  autenticarUsuario,
  permitirRoles("admin"),
  validarFuncion,
  actualizarFuncion
);
router.delete(
  "/:id",
  autenticarUsuario,
  permitirRoles("admin"),
  eliminarFuncion
);

module.exports = router;
