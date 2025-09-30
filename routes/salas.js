const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  permitirRoles,
} = require("../middleware/authMiddleware");
const { validarSala } = require("../utils/validacionesSalas");
const {
  listarSalas,
  obtenerSala,
  crearSala,
  actualizarSala,
  eliminarSala,
} = require("../controllers/salasController");

// 📌 Público
router.get("/", listarSalas);
router.get("/:id", obtenerSala);

// 📌 Admin
router.post(
  "/",
  autenticarUsuario,
  permitirRoles("admin"),
  validarSala,
  crearSala
);
router.patch(
  "/:id",
  autenticarUsuario,
  permitirRoles("admin"),
  validarSala,
  actualizarSala
);
router.delete("/:id", autenticarUsuario, permitirRoles("admin"), eliminarSala);

module.exports = router;
