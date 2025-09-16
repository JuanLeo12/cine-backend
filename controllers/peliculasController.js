const { Pelicula, Funcion } = require("../models");

// 📌 Obtener todas las películas (público)
exports.listarPeliculas = async (req, res) => {
  try {
    const peliculas = await Pelicula.findAll({
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
      ],
    });
    res.json(peliculas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener películas" });
  }
};

// 📌 Obtener una película por ID (público)
exports.obtenerPelicula = async (req, res) => {
  try {
    const pelicula = await Pelicula.findByPk(req.params.id);
    if (!pelicula) {
      return res.status(404).json({ error: "Película no encontrada" });
    }
    res.json(pelicula);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener película" });
  }
};

// 📌 Crear nueva película (solo admin)
exports.crearPelicula = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para crear películas" });
    }

    const {
      titulo,
      genero,
      clasificacion,
      duracion,
      sinopsis,
      imagen_url,
      fecha_estreno,
    } = req.body;

    if (!titulo || !genero || !clasificacion || !duracion || !fecha_estreno) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    if (duracion <= 0) {
      return res
        .status(400)
        .json({ error: "La duración debe ser mayor que cero" });
    }

    if (isNaN(new Date(fecha_estreno).getTime())) {
      return res
        .status(400)
        .json({ error: "La fecha de estreno no es válida" });
    }

    const existe = await Pelicula.findOne({
      where: { titulo: titulo.trim(), fecha_estreno },
    });
    if (existe) {
      return res
        .status(409)
        .json({
          error: "Ya existe una película con ese título y fecha de estreno",
        });
    }

    const nueva = await Pelicula.create({
      titulo: titulo.trim(),
      genero,
      clasificacion,
      duracion,
      sinopsis,
      imagen_url,
      estado: "activa",
      fecha_estreno,
    });

    res.status(201).json(nueva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar película" });
  }
};

// 📌 Actualizar película (solo admin)
exports.actualizarPelicula = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar películas" });
    }

    const pelicula = await Pelicula.findByPk(req.params.id);
    if (!pelicula) {
      return res.status(404).json({ error: "Película no encontrada" });
    }

    const { titulo, fecha_estreno, duracion } = req.body;

    if (duracion != null && duracion <= 0) {
      return res
        .status(400)
        .json({ error: "La duración debe ser mayor que cero" });
    }

    if (fecha_estreno && isNaN(new Date(fecha_estreno).getTime())) {
      return res
        .status(400)
        .json({ error: "La fecha de estreno no es válida" });
    }

    if (titulo && fecha_estreno) {
      const existe = await Pelicula.findOne({
        where: { titulo: titulo.trim(), fecha_estreno },
      });
      if (existe && existe.id !== pelicula.id) {
        return res
          .status(409)
          .json({
            error: "Ya existe otra película con ese título y fecha de estreno",
          });
      }
    }

    await pelicula.update(req.body);
    res.json(pelicula);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar película" });
  }
};

// 📌 Eliminar película (solo admin)
exports.eliminarPelicula = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar películas" });
    }

    const pelicula = await Pelicula.findByPk(req.params.id);
    if (!pelicula) {
      return res.status(404).json({ error: "Película no encontrada" });
    }

    const asociada = await Funcion.findOne({
      where: { id_pelicula: pelicula.id },
    });
    if (asociada) {
      return res
        .status(400)
        .json({
          error:
            "No se puede eliminar una película que tiene funciones asociadas",
        });
    }

    await pelicula.destroy();
    res.json({ mensaje: "Película eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar película" });
  }
};
