const express = require("express");
const router = express.Router();
const { autenticarUsuario, permitirRoles } = require("../middleware/authMiddleware");
const {
  listarOrdenes,
  obtenerOrden,
  crearOrden,
} = require("../controllers/ordenesCompraController");

// 📌 Listar órdenes → admin ve todas, otros ven solo las suyas (filtrado en controlador)
router.get("/", autenticarUsuario, listarOrdenes);

// 📌 Obtener una orden por ID → admin cualquier orden, otros solo las suyas (validación en controlador)
router.get("/:id", autenticarUsuario, obtenerOrden);

// 📌 Crear nueva orden → cualquier usuario autenticado
router.post("/", autenticarUsuario, crearOrden);

module.exports = router;