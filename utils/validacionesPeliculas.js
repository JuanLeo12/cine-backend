const { Pelicula } = require("../models");
const { Op } = require("sequelize");

exports.validarPelicula = async (req, res, next) => {
  try {
    const metodo = req.method.toUpperCase();
    const idPelicula = req.params.id ? parseInt(req.params.id, 10) : null;

    // Si es POST (crear), todos los campos obligatorios
    if (metodo === "POST") {
      const { titulo, genero, clasificacion, duracion, fecha_estreno } =
        req.body;

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
        where: {
          titulo: titulo.trim(),
          fecha_estreno,
        },
      });

      if (existe) {
        return res.status(409).json({
          error: "Ya existe una película con ese título y fecha de estreno",
        });
      }

      req.body.titulo = titulo.trim();
      return next();
    }

    // Si es PATCH (actualizar), permitir actualizaciones parciales
    if (metodo === "PATCH") {
      const camposPermitidos = [
        "titulo",
        "genero",
        "clasificacion",
        "sinopsis",
        "imagen_url",
        "fecha_estreno",
        "duracion",
        "estado",
      ];

      const camposInvalidos = Object.keys(req.body).filter(
        (campo) => !camposPermitidos.includes(campo)
      );
      if (camposInvalidos.length > 0) {
        return res
          .status(400)
          .json({ error: `Campos inválidos: ${camposInvalidos.join(", ")}` });
      }

      // Validaciones opcionales solo si el campo está presente
      if (req.body.duracion && req.body.duracion <= 0) {
        return res
          .status(400)
          .json({ error: "La duración debe ser mayor que cero" });
      }

      if (
        req.body.fecha_estreno &&
        isNaN(new Date(req.body.fecha_estreno).getTime())
      ) {
        return res
          .status(400)
          .json({ error: "La fecha de estreno no es válida" });
      }

      // Validar duplicado solo si se cambió título o fecha_estreno
      if (req.body.titulo || req.body.fecha_estreno) {
        const where = {
          ...(req.body.titulo && { titulo: req.body.titulo.trim() }),
          ...(req.body.fecha_estreno && {
            fecha_estreno: req.body.fecha_estreno,
          }),
          id: { [Op.ne]: idPelicula },
        };

        const existe = await Pelicula.findOne({ where });
        if (existe) {
          return res.status(409).json({
            error: "Ya existe una película con ese título y fecha de estreno",
          });
        }
      }

      if (req.body.titulo) req.body.titulo = req.body.titulo.trim();
      return next();
    }

    // Si es otro método (GET, DELETE, etc.)
    next();
  } catch (error) {
    console.error("Error en validación de película:", error);
    res.status(500).json({ error: "Error en validación de película" });
  }
};
