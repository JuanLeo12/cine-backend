const express = require("express");
const router = express.Router();
const { autenticarUsuario } = require("../middleware/authMiddleware");
const {
  listarOrdenes,
  obtenerOrden,
  crearOrden,
  confirmarOrden,
  cancelarOrden,
} = require("../controllers/ordenesCompraController");

// 📌 Listar órdenes → admin todas, usuarios solo las suyas
router.get("/", autenticarUsuario, listarOrdenes);

// 📌 Obtener orden por ID → admin cualquiera, usuarios solo la suya
router.get("/:id", autenticarUsuario, obtenerOrden);

// 📌 Crear nueva orden → cualquier usuario autenticado
router.post("/", autenticarUsuario, crearOrden);

// 📌 Confirmar orden (pago simulado) → solo el dueño
router.post("/:id/confirmar", autenticarUsuario, confirmarOrden);

// 📌 Cancelar orden → solo el dueño o admin
router.delete("/:id", autenticarUsuario, cancelarOrden);

module.exports = router;
