const { Sede, Sala, Publicidad } = require("../models");
const { validarCamposSede } = require("../utils/validacionesSede");
const { Op } = require("sequelize");

// 📌 Listar todas las sedes
exports.listarSedes = async (req, res) => {
  try {
    const sedes = await Sede.findAll({
      where: { estado: 'activo' },
      order: [["nombre", "ASC"]],
      include: [
        { model: Sala, as: "salas", attributes: ["id", "nombre", "tipo_sala"] },
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

// 📌 Crear nueva sede (con salas opcionales)
exports.crearSede = async (req, res) => {
  try {
    const { nombre, direccion, ciudad, telefono, imagen_url, salas } = req.body;

    // Validar todos los campos
    const errores = validarCamposSede({ nombre, direccion, ciudad, telefono, imagen_url });
    if (errores.length > 0) return res.status(400).json({ errores });

    // Buscar duplicados exactos (mismo nombre y ciudad, ignorando mayúsculas)
    const duplicado = await Sede.findOne({
      where: {
        nombre: {
          [Op.iLike]: nombre.trim() // Case-insensitive en PostgreSQL
        },
        ciudad: {
          [Op.iLike]: ciudad.trim()
        }
      }
    });
    
    if (duplicado) {
      return res
        .status(409)
        .json({ 
          error: `Ya existe una sede con el nombre "${duplicado.nombre}" en ${duplicado.ciudad}` 
        });
    }

    const nueva = await Sede.create({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      telefono: req.body.telefono,
      imagen_url: req.body.imagen_url,
    });

    // 🔹 Crear salas si se especificaron
    if (salas && Array.isArray(salas) && salas.length > 0) {
      for (const [index, salaData] of salas.entries()) {
        await Sala.create({
          nombre: salaData.nombre || `Sala ${index + 1}`,
          tipo_sala: salaData.tipo_sala || "2D",
          filas: salaData.filas || 10,
          columnas: salaData.columnas || 12,
          id_sede: nueva.id,
        });
      }
    }

    // Recargar sede con salas
    const sedeConSalas = await Sede.findByPk(nueva.id, {
      include: [{ model: Sala, as: "salas" }],
    });

    res.status(201).json({
      mensaje: "Sede creada correctamente",
      sede: sedeConSalas,
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

    const { nombre, direccion, ciudad, telefono, imagen_url } = req.body;

    // Validar todos los campos (modo actualización)
    const errores = validarCamposSede({ nombre, direccion, ciudad, telefono, imagen_url }, true);
    if (errores.length > 0) return res.status(400).json({ errores });

    // Verificar duplicados si se está cambiando nombre o ciudad
    if (nombre && ciudad) {
      const duplicado = await Sede.findOne({
        where: {
          nombre: {
            [Op.iLike]: nombre.trim()
          },
          ciudad: {
            [Op.iLike]: ciudad.trim()
          }
        }
      });
      
      if (duplicado && duplicado.id !== sede.id) {
        return res.status(409).json({
          error: `Ya existe otra sede con el nombre "${duplicado.nombre}" en ${duplicado.ciudad}`,
        });
      }
    }

    await sede.update({
      nombre: nombre?.trim() || sede.nombre,
      direccion: direccion?.trim() || sede.direccion,
      ciudad: ciudad?.trim() || sede.ciudad,
      telefono: telefono?.trim() || sede.telefono,
      imagen_url: imagen_url?.trim() || sede.imagen_url,
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
