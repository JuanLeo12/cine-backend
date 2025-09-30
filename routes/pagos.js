const express = require("express");
const router = express.Router();
const { autenticarUsuario } = require("../middleware/authMiddleware");
const {
  listarPagos,
  obtenerPago,
  crearPago,
} = require("../controllers/pagosController");

// 📌 Listar pagos → admin todos, usuario solo los suyos
router.get("/", autenticarUsuario, listarPagos);

// 📌 Obtener pago por ID → admin cualquiera, usuario solo los suyos
router.get("/:id", autenticarUsuario, obtenerPago);

// 📌 Crear pago → cualquier usuario autenticado
router.post("/", autenticarUsuario, crearPago);

module.exports = router;
