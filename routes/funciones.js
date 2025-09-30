const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  permitirRoles,
} = require("../middleware/authMiddleware");
const { validarFuncion } = require("../utils/validacionesFunciones");

const {
  listarFunciones,
  obtenerFuncion,
  crearFuncion,
  actualizarFuncion,
  eliminarFuncion,
} = require("../controllers/funcionesController");

// 📌 Público
router.get("/", listarFunciones);
router.get("/:id", obtenerFuncion);

// 📌 Admin
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
