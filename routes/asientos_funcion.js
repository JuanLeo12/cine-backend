const express = require("express");
const router = express.Router();
const { autenticarUsuario } = require("../middleware/authMiddleware");
const {
  listarAsientosPorFuncion,
  bloquearAsiento,
  liberarAsiento,
  liberarAsientosUsuarioEnFuncion,
} = require("../controllers/asientosFuncionController");

// 📍 Listar asientos de una función → público
router.get("/funcion/:id_funcion", listarAsientosPorFuncion);

// 📍 Bloquear asiento → usuario autenticado
router.post("/bloquear", autenticarUsuario, bloquearAsiento);

// 📍 Liberar asiento → usuario autenticado
router.post("/liberar", autenticarUsuario, liberarAsiento);

// 📍 Liberar todos los asientos del usuario en una función → usuario autenticado
router.post("/liberar-usuario/:id_funcion", autenticarUsuario, liberarAsientosUsuarioEnFuncion);

module.exports = router;
