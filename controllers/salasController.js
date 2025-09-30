const { Sala, Sede, Funcion, AlquilerSala } = require("../models");

// 📌 Listar salas activas
exports.listarSalas = async (req, res) => {
  try {
    const salas = await Sala.findAll({
      where: { estado: "activa" },
      attributes: ["id", "nombre", "filas", "columnas", "estado"],
      include: [
        { model: Sede, as: "sede", attributes: ["id", "nombre", "ciudad"] },
      ],
    });
    res.json(salas);
  } catch (error) {
    console.error("Error listarSalas:", error);
    res.status(500).json({ error: "Error al obtener salas" });
  }
};

// 📌 Obtener una sala por ID
exports.obtenerSala = async (req, res) => {
  try {
    const sala = await Sala.findOne({
      where: { id: req.params.id, estado: "activa" },
      include: [
        { model: Sede, as: "sede", attributes: ["id", "nombre", "ciudad"] },
      ],
    });

    if (!sala) {
      return res.status(404).json({ error: "Sala no encontrada o inactiva" });
    }

    res.json(sala);
  } catch (error) {
    console.error("Error obtenerSala:", error);
    res.status(500).json({ error: "Error al obtener sala" });
  }
};

// 📌 Crear nueva sala (solo admin)
exports.crearSala = async (req, res) => {
  try {
    const nueva = await Sala.create({ ...req.body, estado: "activa" });
    res.status(201).json({
      mensaje: "Sala creada correctamente",
      sala: nueva,
    });
  } catch (error) {
    console.error("Error crearSala:", error);
    res.status(500).json({ error: "Error al registrar sala" });
  }
};

// 📌 Actualizar sala (solo admin)
exports.actualizarSala = async (req, res) => {
  try {
    const sala = await Sala.findByPk(req.params.id);
    if (!sala || sala.estado === "inactiva") {
      return res.status(404).json({ error: "Sala no encontrada o inactiva" });
    }

    await sala.update(req.body);
    res.json({
      mensaje: "Sala actualizada correctamente",
      sala,
    });
  } catch (error) {
    console.error("Error actualizarSala:", error);
    res.status(500).json({ error: "Error al actualizar sala" });
  }
};

// 📌 Eliminar sala (soft delete → inactiva)
exports.eliminarSala = async (req, res) => {
  try {
    const sala = await Sala.findByPk(req.params.id);
    if (!sala || sala.estado === "inactiva") {
      return res
        .status(404)
        .json({ error: "Sala no encontrada o ya inactiva" });
    }

    // Validar dependencias
    const asociadaFuncion = await Funcion.findOne({
      where: { id_sala: sala.id },
    });
    if (asociadaFuncion) {
      return res.status(400).json({
        error: "No se puede eliminar una sala con funciones asociadas",
      });
    }

    const asociadaAlquiler = await AlquilerSala.findOne({
      where: { id_sala: sala.id },
    });
    if (asociadaAlquiler) {
      return res.status(400).json({
        error: "No se puede eliminar una sala con alquileres asociados",
      });
    }

    await sala.update({ estado: "inactiva" });
    res.json({ mensaje: "Sala inactivada correctamente" });
  } catch (error) {
    console.error("Error eliminarSala:", error);
    res.status(500).json({ error: "Error al eliminar sala" });
  }
};
