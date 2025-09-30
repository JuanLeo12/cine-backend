const express = require("express");
const router = express.Router();
const { autenticarUsuario } = require("../middleware/authMiddleware");
const {
  listarTickets,
  crearTicket,
  eliminarTicket,
} = require("../controllers/ordenesTicketsController");

// 📌 Listar → admin ve todas, usuarios solo las suyas
router.get("/", autenticarUsuario, listarTickets);

// 📌 Crear ticket en orden → cualquier usuario autenticado
router.post("/", autenticarUsuario, crearTicket);

// 📌 Eliminar ticket → admin o dueño (validación en controlador)
router.delete("/:id", autenticarUsuario, eliminarTicket);

module.exports = router;
