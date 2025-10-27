const { Sede, Sala, Publicidad } = require("../models");
const { validarCamposSede } = require("../utils/validacionesSede");

// 📌 Listar todas las sedes
exports.listarSedes = async (req, res) => {
  try {
    const sedes = await Sede.findAll({
      where: { estado: "activo" },
      // Incluir imagen_url para que el frontend público pueda mostrar la imagen de la sede
      attributes: ["id", "nombre", "direccion", "ciudad", "imagen_url", "telefono"],
      order: [["nombre", "ASC"]],
      include: [
        { model: Sala, as: "salas", attributes: ["id", "nombre"] },
        { model: Publicidad, as: "publicidadesSede", attributes: ["id", "tipo"], required: false },
      ],
    });
    res.json(sedes);
  } catch (error) {
    console.error("Error en listarSedes:", error);
    res.status(500).json({ error: "Error al obtener sedes" });
  }
};

// 📌 Obtener una sede por ID
exports.obtenerSede = async (req, res) => {
  try {
    const sede = await Sede.findByPk(req.params.id, {
      include: [
        { model: Sala, as: "salas", attributes: ["id", "nombre"] },
        { model: Publicidad, as: "publicidadesSede", attributes: ["id", "tipo"], required: false },
      ],
    });

    if (!sede || sede.estado === "inactivo") return res.status(404).json({ error: "Sede no encontrada" });
    res.json(sede);
  } catch (error) {
    console.error("Error en obtenerSede:", error);
    res.status(500).json({ error: "Error al obtener sede" });
  }
};

// 📌 Crear nueva sede
exports.crearSede = async (req, res) => {
  try {
    const { nombre, direccion, ciudad } = req.body;

    const errores = validarCamposSede({ nombre, direccion, ciudad });
    if (errores.length > 0) return res.status(400).json({ errores });

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

    res.status(201).json({
      mensaje: "Sede creada correctamente",
      sede: nueva,
    });
  } catch (error) {
    console.error("Error en crearSede:", error);
    res.status(500).json({ error: "Error al registrar sede" });
  }
};

// 📌 Actualizar sede
exports.actualizarSede = async (req, res) => {
  try {
    const sede = await Sede.findByPk(req.params.id);
    if (!sede) return res.status(404).json({ error: "Sede no encontrada" });

    const { nombre, direccion, ciudad } = req.body;

    const errores = validarCamposSede({ nombre, direccion, ciudad }, true);
    if (errores.length > 0) return res.status(400).json({ errores });

    if (nombre && ciudad) {
      const existe = await Sede.findOne({
        where: { nombre: nombre.trim(), ciudad: ciudad.trim() },
      });
      if (existe && existe.id !== sede.id) {
        return res.status(409).json({
          error: "Ya existe otra sede con ese nombre en esta ciudad",
        });
      }
    }

    await sede.update({
      ...req.body,
      nombre: nombre?.trim() || sede.nombre,
      direccion: direccion?.trim() || sede.direccion,
      ciudad: ciudad?.trim() || sede.ciudad,
    });

    res.json({ mensaje: "Sede actualizada correctamente", sede });
  } catch (error) {
    console.error("Error en actualizarSede:", error);
    res.status(500).json({ error: "Error al actualizar sede" });
  }
};

// 📌 Eliminar sede
exports.eliminarSede = async (req, res) => {
  try {
    const sede = await Sede.findByPk(req.params.id);
    if (!sede) return res.status(404).json({ error: "Sede no encontrada" });

    // 🔗 Validar dependencias usando asociaciones
    const asociadaSala = await Sala.findOne({ where: { id_sede: sede.id } });
    if (asociadaSala) {
      return res.status(400).json({
        error: "No se puede eliminar una sede con salas asociadas",
      });
    }

    const asociadaPublicidad = await Publicidad.findOne({
      where: { id_sede: sede.id },
    });
    if (asociadaPublicidad) {
      return res.status(400).json({
        error:
          "No se puede eliminar una sede con campañas publicitarias asociadas",
      });
    }

    await sede.update({ estado: "inactivo" });
    res.json({ mensaje: "Sede inactivada correctamente" });
  } catch (error) {
    console.error("Error en eliminarSede:", error);
    res.status(500).json({ error: "Error al eliminar sede" });
  }
};
