const { Sede, Sala, Publicidad } = require("../models");

// 📌 Obtener todas las sedes (público o autenticado)
exports.listarSedes = async (req, res) => {
  try {
    const sedes = await Sede.findAll({
      attributes: ["id", "nombre", "direccion", "ciudad"],
    });
    res.json(sedes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener sedes" });
  }
};

// 📌 Obtener una sede por ID (público o autenticado)
exports.obtenerSede = async (req, res) => {
  try {
    const sede = await Sede.findByPk(req.params.id);
    if (!sede) {
      return res.status(404).json({ error: "Sede no encontrada" });
    }
    res.json(sede);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener sede" });
  }
};

// 📌 Crear nueva sede (solo admin)
exports.crearSede = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para crear sedes" });
    }

    const { nombre, direccion, ciudad } = req.body;

    if (!nombre || !direccion || !ciudad) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    const existe = await Sede.findOne({
      where: { nombre: nombre.trim(), ciudad: ciudad.trim() },
    });
    if (existe) {
      return res
        .status(409)
        .json({ error: "Ya existe una sede con ese nombre en esta ciudad" });
    }

    const nueva = await Sede.create({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
    });

    res.status(201).json(nueva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar sede" });
  }
};

// 📌 Actualizar sede (solo admin)
exports.actualizarSede = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar sedes" });
    }

    const sede = await Sede.findByPk(req.params.id);
    if (!sede) {
      return res.status(404).json({ error: "Sede no encontrada" });
    }

    const { nombre, ciudad } = req.body;

    if (nombre && ciudad) {
      const existe = await Sede.findOne({
        where: { nombre: nombre.trim(), ciudad: ciudad.trim() },
      });
      if (existe && existe.id !== sede.id) {
        return res
          .status(409)
          .json({ error: "Ya existe otra sede con ese nombre en esta ciudad" });
      }
    }

    await sede.update({
      ...req.body,
      nombre: nombre?.trim() || sede.nombre,
      ciudad: ciudad?.trim() || sede.ciudad,
    });

    res.json(sede);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar sede" });
  }
};

// 📌 Eliminar sede (solo admin)
exports.eliminarSede = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar sedes" });
    }

    const sede = await Sede.findByPk(req.params.id);
    if (!sede) {
      return res.status(404).json({ error: "Sede no encontrada" });
    }

    const asociadaSala = await Sala.findOne({ where: { id_sede: sede.id } });
    if (asociadaSala) {
      return res
        .status(400)
        .json({ error: "No se puede eliminar una sede con salas asociadas" });
    }

    const asociadaPublicidad = await Publicidad.findOne({
      where: { id_sede: sede.id },
    });
    if (asociadaPublicidad) {
      return res
        .status(400)
        .json({
          error:
            "No se puede eliminar una sede con campañas publicitarias asociadas",
        });
    }

    await sede.destroy();
    res.json({ mensaje: "Sede eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar sede" });
  }
};
