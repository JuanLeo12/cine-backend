const { Pelicula, Funcion } = require("../models");
const { Op } = require("sequelize");

// 📌 Listar películas activas (con filtros dinámicos)
exports.listarPeliculas = async (req, res) => {
  try {
    const { tipo, genero, clasificacion } = req.query;

    // 🔹 Base: solo películas activas
    const where = { estado: "activa" };

    // 🔹 Filtro por tipo (cartelera o proxEstreno)
    if (tipo) {
      where.tipo = tipo;
    }

    // 🔹 Filtro por género (case-insensitive)
    if (genero) {
      where.genero = { [Op.iLike]: `%${genero}%` }; // usa LIKE parcial
    }

    // 🔹 Filtro por clasificación exacta
    if (clasificacion) {
      where.clasificacion = clasificacion;
    }

    const peliculas = await Pelicula.findAll({
      where,
      attributes: [
        "id",
        "titulo",
        "genero",
        "clasificacion",
        "duracion",
        "sinopsis",
        "imagen_url",
        "estado",
        "fecha_estreno",
        "tipo",
      ],
      order: [["fecha_estreno", "DESC"]],
      include: [
        {
          model: Funcion,
          as: "funciones",
          attributes: ["id", "fecha", "hora", "estado"],
        },
      ],
    });

    res.json(peliculas);
  } catch (error) {
    console.error("Error al listar películas:", error);
    res.status(500).json({ error: "Error al obtener películas" });
  }
};

// 📌 Obtener película por ID
exports.obtenerPelicula = async (req, res) => {
  try {
    const pelicula = await Pelicula.findOne({
      where: { id: req.params.id, estado: "activa" },
      include: [
        {
          model: Funcion,
          as: "funciones",
          attributes: ["id", "fecha", "hora", "estado"],
        },
      ],
    });

    if (!pelicula) {
      return res
        .status(404)
        .json({ error: "Película no encontrada o inactiva" });
    }

    res.json(pelicula);
  } catch (error) {
    console.error("Error al obtener película:", error);
    res.status(500).json({ error: "Error al obtener película" });
  }
};

// 📌 Crear película (solo admin)
exports.crearPelicula = async (req, res) => {
  try {
    const nueva = await Pelicula.create({
      ...req.body,
      estado: "activa",
      tipo: req.body.tipo || "cartelera",
    });

    res
      .status(201)
      .json({ mensaje: "Película creada correctamente", pelicula: nueva });
  } catch (error) {
    console.error("Error al crear película:", error);
    res.status(500).json({ error: "Error al registrar película" });
  }
};

// 📌 Actualizar película (solo admin)
exports.actualizarPelicula = async (req, res) => {
  try {
    const pelicula = await Pelicula.findByPk(req.params.id);
    if (!pelicula || pelicula.estado === "inactiva") {
      return res
        .status(404)
        .json({ error: "Película no encontrada o inactiva" });
    }

    await pelicula.update(req.body);
    res.json({ mensaje: "Película actualizada correctamente", pelicula });
  } catch (error) {
    console.error("Error al actualizar película:", error);
    res.status(500).json({ error: "Error al actualizar película" });
  }
};

// 📌 Eliminar película (soft delete → inactiva)
exports.eliminarPelicula = async (req, res) => {
  try {
    const pelicula = await Pelicula.findByPk(req.params.id);
    if (!pelicula || pelicula.estado === "inactiva") {
      return res
        .status(404)
        .json({ error: "Película no encontrada o ya inactiva" });
    }

    const asociada = await Funcion.findOne({
      where: { id_pelicula: pelicula.id },
    });

    if (asociada) {
      return res.status(400).json({
        error: "No se puede eliminar una película con funciones asociadas",
      });
    }

    await pelicula.update({ estado: "inactiva" });
    res.json({ mensaje: "Película inactivada correctamente" });
  } catch (error) {
    console.error("Error al eliminar película:", error);
    res.status(500).json({ error: "Error al eliminar película" });
  }
};
