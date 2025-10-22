const express = require("express");
const router = express.Router();
const { autenticarUsuario } = require("../middleware/authMiddleware");
const {
  listarTickets,
  obtenerTicket,
  crearTicket,
  eliminarTicket,
  validarTicketController,
} = require("../controllers/ticketsController");

// 📍 Listar tickets → admin todos, usuario solo los suyos
router.get("/", autenticarUsuario, listarTickets);

// 📍 Obtener ticket por ID
router.get("/:id", autenticarUsuario, obtenerTicket);

// 📍 Crear ticket
router.post("/", autenticarUsuario, crearTicket);

// 📍 Validar ticket (escaneo QR)
router.patch("/:id/validar", autenticarUsuario, validarTicketController);

// 📍 Eliminar ticket
router.delete("/:id", autenticarUsuario, eliminarTicket);

module.exports = router;
