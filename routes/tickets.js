const express = require("express");
const router = express.Router();
const { autenticarUsuario } = require("../middleware/authMiddleware");
const {
  listarTickets,
  obtenerTicket,
  crearTicket,
  eliminarTicket,
} = require("../controllers/ticketsController");

// 📍 Listar tickets → admin todos, usuario solo los suyos
router.get("/", autenticarUsuario, listarTickets);

// 📍 Obtener ticket por ID
router.get("/:id", autenticarUsuario, obtenerTicket);

// 📍 Crear ticket
router.post("/", autenticarUsuario, crearTicket);

// 📍 Eliminar ticket
router.delete("/:id", autenticarUsuario, eliminarTicket);

module.exports = router;
