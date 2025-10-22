const express = require("express");
const router = express.Router();
const { autenticarUsuario } = require("../middleware/authMiddleware");
const {
  listarAsientosPorFuncion,
  bloquearAsiento,
  liberarAsiento,
} = require("../controllers/asientosFuncionController");

// 📍 Listar asientos de una función → público
router.get("/funcion/:id_funcion", listarAsientosPorFuncion);

// 📍 Bloquear asiento → usuario autenticado
router.post("/bloquear", autenticarUsuario, bloquearAsiento);

// 📍 Liberar asiento → usuario autenticado
router.post("/liberar", autenticarUsuario, liberarAsiento);

module.exports = router;
