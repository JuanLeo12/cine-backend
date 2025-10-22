const { Funcion, Pelicula, Sala, Usuario } = require("../models");

// 📌 Obtener todas las funciones (solo activas)
exports.listarFunciones = async (req, res) => {
  try {
    const funciones = await Funcion.findAll({
      where: { estado: "activa" },
      include: [
        {
          model: Pelicula,
          as: "pelicula",
          attributes: ["id", "titulo", "genero"],
        },
        { model: Sala, as: "sala", attributes: ["id", "nombre"] },
        {
          model: Usuario,
          as: "clienteCorporativo",
          attributes: ["id", "nombre"],
        },
      ],
    });
    res.json(funciones);
  } catch (error) {
    console.error("Error listarFunciones:", error);
    res.status(500).json({ error: "Error al obtener funciones" });
  }
};

// 📌 Obtener una función por ID
exports.obtenerFuncion = async (req, res) => {
  try {
    const funcion = await Funcion.findOne({
      where: { id: req.params.id, estado: "activa" },
      include: [
        { model: Pelicula, as: "pelicula" },
        { model: Sala, as: "sala" },
        { model: Usuario, as: "clienteCorporativo" },
      ],
    });

    if (!funcion) {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    res.json(funcion);
  } catch (error) {
    console.error("Error obtenerFuncion:", error);
    res.status(500).json({ error: "Error al obtener función" });
  }
};

// 📌 Crear nueva función
exports.crearFuncion = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { fecha, hora, id_pelicula, id_sala } = req.body;

    if (!fecha || !hora || !id_pelicula || !id_sala) {
      return res
        .status(400)
        .json({ error: "Campos obligatorios: película, sala, fecha y hora" });
    }

    const nueva = await Funcion.create(req.body);
    res.status(201).json({ mensaje: "Función creada correctamente", funcion: nueva });
  } catch (error) {
    console.error("Error crearFuncion:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ error: "Ya existe una función en esa sala, fecha y hora" });
    }
    res.status(500).json({ error: "Error al crear función" });
  }
};

// 📌 Actualizar función
exports.actualizarFuncion = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { fecha, hora, id_pelicula, id_sala } = req.body;

    if (!fecha || !hora || !id_pelicula || !id_sala) {
      return res
        .status(400)
        .json({ error: "Campos obligatorios: película, sala, fecha y hora" });
    }

    const funcion = await Funcion.findByPk(req.params.id);
    if (!funcion || funcion.estado === "inactiva") {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    await funcion.update(req.body);
    res.json({ mensaje: "Función actualizada correctamente", funcion });
  } catch (error) {
    console.error("Error actualizarFuncion:", error);
    res.status(500).json({ error: "Error al actualizar función" });
  }
};

// 📌 Eliminar función (soft delete)
exports.eliminarFuncion = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const funcion = await Funcion.findByPk(req.params.id);
    if (!funcion || funcion.estado === "inactiva") {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    await funcion.update({ estado: "inactiva" });
    res.json({ mensaje: "Función cancelada correctamente" });
  } catch (error) {
    console.error("Error eliminarFuncion:", error);
    res.status(500).json({ error: "Error al eliminar función" });
  }
};
