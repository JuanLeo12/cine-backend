const { Sala, Sede, Funcion, AlquilerSala } = require("../models");

// 📌 Obtener todas las salas (público)
exports.listarSalas = async (req, res) => {
  try {
    const salas = await Sala.findAll({
      attributes: ["id", "nombre", "filas", "columnas"],
      include: [{ model: Sede, attributes: ["id", "nombre", "ciudad"] }],
    });
    res.json(salas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener salas" });
  }
};

// 📌 Obtener una sala por ID (público)
exports.obtenerSala = async (req, res) => {
  try {
    const sala = await Sala.findByPk(req.params.id, {
      include: [{ model: Sede, attributes: ["id", "nombre", "ciudad"] }],
    });

    if (!sala) {
      return res.status(404).json({ error: "Sala no encontrada" });
    }

    res.json(sala);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener sala" });
  }
};

// 📌 Crear nueva sala (solo admin)
exports.crearSala = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para crear salas" });
    }

    const { id_sede, nombre, filas, columnas } = req.body;

    if (!id_sede || !nombre || !filas || !columnas) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    if (filas <= 0 || columnas <= 0) {
      return res
        .status(400)
        .json({ error: "Filas y columnas deben ser mayores que cero" });
    }

    const sede = await Sede.findByPk(id_sede);
    if (!sede) {
      return res.status(404).json({ error: "Sede no encontrada" });
    }

    const existe = await Sala.findOne({
      where: { id_sede, nombre: nombre.trim() },
    });
    if (existe) {
      return res
        .status(409)
        .json({ error: "Ya existe una sala con ese nombre en esta sede" });
    }

    const nueva = await Sala.create({
      id_sede,
      nombre: nombre.trim(),
      filas,
      columnas,
    });

    res.status(201).json(nueva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar sala" });
  }
};

// 📌 Actualizar sala (solo admin)
exports.actualizarSala = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar salas" });
    }

    const sala = await Sala.findByPk(req.params.id);
    if (!sala) {
      return res.status(404).json({ error: "Sala no encontrada" });
    }

    const { id_sede, nombre, filas, columnas } = req.body;

    if (filas != null && filas <= 0) {
      return res.status(400).json({ error: "Filas debe ser mayor que cero" });
    }

    if (columnas != null && columnas <= 0) {
      return res
        .status(400)
        .json({ error: "Columnas debe ser mayor que cero" });
    }

    if (id_sede) {
      const sede = await Sede.findByPk(id_sede);
      if (!sede) {
        return res.status(404).json({ error: "Sede no encontrada" });
      }
    }

    if (nombre && id_sede) {
      const existe = await Sala.findOne({
        where: { id_sede, nombre: nombre.trim() },
      });
      if (existe && existe.id !== sala.id) {
        return res
          .status(409)
          .json({ error: "Ya existe otra sala con ese nombre en esta sede" });
      }
    }

    await sala.update({ ...req.body, nombre: nombre?.trim() || sala.nombre });
    res.json(sala);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar sala" });
  }
};

// 📌 Eliminar sala (solo admin)
exports.eliminarSala = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar salas" });
    }

    const sala = await Sala.findByPk(req.params.id);
    if (!sala) {
      return res.status(404).json({ error: "Sala no encontrada" });
    }

    const asociadaFuncion = await Funcion.findOne({
      where: { id_sala: sala.id },
    });
    if (asociadaFuncion) {
      return res
        .status(400)
        .json({
          error: "No se puede eliminar una sala con funciones asociadas",
        });
    }

    const asociadaAlquiler = await AlquilerSala.findOne({
      where: { id_sala: sala.id },
    });
    if (asociadaAlquiler) {
      return res
        .status(400)
        .json({
          error: "No se puede eliminar una sala con alquileres asociados",
        });
    }

    await sala.destroy();
    res.json({ mensaje: "Sala eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar sala" });
  }
};
