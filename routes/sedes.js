const express = require("express");
const router = express.Router();
const {
  autenticarUsuario,
  permitirRoles,
} = require("../middleware/authMiddleware");
const {
  listarSedes,
  listarTodasLasSedes,
  obtenerSede,
  crearSede,
  actualizarSede,
  eliminarSede,
  verificarImpactoSalas,
  reactivarSede,
} = require("../controllers/sedesController");

// 📌 Listar sedes → público
router.get("/", listarSedes);

// 📌 Listar TODAS las sedes (incluyendo inactivas) → solo admin
router.get("/admin/todas", autenticarUsuario, permitirRoles("admin"), listarTodasLasSedes);

// 📌 Obtener sede por ID → público
router.get("/:id", obtenerSede);

// 📌 Verificar impacto de modificar salas → solo admin
router.post("/:id/verificar-impacto", autenticarUsuario, permitirRoles("admin"), verificarImpactoSalas);

// 📌 Reactivar sede inactiva → solo admin
router.patch("/:id/reactivar", autenticarUsuario, permitirRoles("admin"), reactivarSede);

// 📌 Crear sede → solo admin
router.post("/", autenticarUsuario, permitirRoles("admin"), crearSede);

// 📌 Actualizar sede → solo admin
router.put("/:id", autenticarUsuario, permitirRoles("admin"), actualizarSede);

// 📌 Eliminar sede → solo admin
router.delete("/:id", autenticarUsuario, permitirRoles("admin"), eliminarSede);

module.exports = router;
