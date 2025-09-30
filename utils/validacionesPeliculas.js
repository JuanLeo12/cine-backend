const { Pelicula } = require("../models");
const { Op } = require("sequelize");

exports.validarPelicula = async (req, res, next) => {
  try {
    const { titulo, genero, clasificacion, duracion, fecha_estreno } = req.body;
    const idPelicula = req.params.id ? parseInt(req.params.id, 10) : null;

    // Campos obligatorios
    if (!titulo || !genero || !clasificacion || !duracion || !fecha_estreno) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // Duración > 0
    if (duracion <= 0) {
      return res
        .status(400)
        .json({ error: "La duración debe ser mayor que cero" });
    }

    // Fecha válida
    if (isNaN(new Date(fecha_estreno).getTime())) {
      return res
        .status(400)
        .json({ error: "La fecha de estreno no es válida" });
    }

    // Validar duplicados (titulo + fecha_estreno)
    const existe = await Pelicula.findOne({
      where: {
        titulo: titulo.trim(),
        fecha_estreno,
        ...(idPelicula && { id: { [Op.ne]: idPelicula } }),
      },
    });

    if (existe) {
      return res.status(409).json({
        error: "Ya existe una película con ese título y fecha de estreno",
      });
    }

    req.body.titulo = titulo.trim();
    next();
  } catch (error) {
    console.error("Error en validación de película:", error);
    res.status(500).json({ error: "Error en validación de película" });
  }
};
