const express = require("express");
const router = express.Router();
const { autenticarUsuario } = require("../middleware/authMiddleware");
const {
  listarAsientos,
  reservarAsiento,
  eliminarAsiento,
} = require("../controllers/asientosFuncionController");

// 📍 Listar asientos → admin ve todos, otros solo los suyos
router.get("/", autenticarUsuario, listarAsientos);

// 📍 Reservar asiento → cualquier usuario autenticado
router.post("/", autenticarUsuario, reservarAsiento);

// 📍 Eliminar asiento → admin o dueño (validación en controlador)
router.delete("/:id", autenticarUsuario, eliminarAsiento);

module.exports = router;
