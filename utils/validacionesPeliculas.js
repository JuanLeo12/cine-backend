const { Pelicula } = require("../models");
const { Op } = require("sequelize");

exports.validarPelicula = async (req, res, next) => {
  try {
    const metodo = req.method.toUpperCase();
    const idPelicula = req.params.id ? parseInt(req.params.id, 10) : null;

    // ----------------------------------------------------
    // 📌 CREAR (POST)
    // ----------------------------------------------------
    if (metodo === "POST") {
      const {
        titulo,
        genero,
        clasificacion,
        duracion,
        fecha_estreno,
        tipo,
        imagen_url,
      } = req.body;

      // Validar campos obligatorios
      if (!titulo || !genero || !clasificacion || !duracion || !fecha_estreno) {
        return res.status(400).json({
          error:
            "Faltan campos obligatorios: título, género, clasificación, duración o fecha de estreno.",
        });
      }

      // Validar duración
      if (duracion <= 0) {
        return res.status(400).json({
          error: "La duración debe ser mayor que cero.",
        });
      }

      // Validar formato de fecha
      if (isNaN(new Date(fecha_estreno).getTime())) {
        return res.status(400).json({
          error: "La fecha de estreno no es válida.",
        });
      }

      // Validar tipo permitido
      const tipoValido = ["cartelera", "proxEstreno"];
      if (tipo && !tipoValido.includes(tipo)) {
        return res.status(400).json({
          error: `Tipo inválido. Debe ser uno de: ${tipoValido.join(", ")}.`,
        });
      }

      // Validar duplicado
      const existe = await Pelicula.findOne({
        where: {
          titulo: titulo.trim(),
          fecha_estreno,
        },
      });

      if (existe) {
        return res.status(409).json({
          error: "Ya existe una película con ese título y fecha de estreno.",
        });
      }

      // Limpiar datos
      req.body.titulo = titulo.trim();
      req.body.tipo = tipo || "cartelera"; // por defecto
      req.body.imagen_url = imagen_url || null;

      return next();
    }

    // ----------------------------------------------------
    // 📌 ACTUALIZAR (PATCH)
    // ----------------------------------------------------
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
        "tipo",
      ];

      // Validar que no haya campos extraños
      const camposInvalidos = Object.keys(req.body).filter(
        (campo) => !camposPermitidos.includes(campo)
      );

      if (camposInvalidos.length > 0) {
        return res.status(400).json({
          error: `Campos no permitidos: ${camposInvalidos.join(", ")}`,
        });
      }

      // Validar duración si está presente
      if (req.body.duracion && req.body.duracion <= 0) {
        return res.status(400).json({
          error: "La duración debe ser mayor que cero.",
        });
      }

      // Validar fecha de estreno
      if (
        req.body.fecha_estreno &&
        isNaN(new Date(req.body.fecha_estreno).getTime())
      ) {
        return res.status(400).json({
          error: "La fecha de estreno no es válida.",
        });
      }

      // Validar tipo
      if (req.body.tipo) {
        const tipoValido = ["cartelera", "proxEstreno"];
        if (!tipoValido.includes(req.body.tipo)) {
          return res.status(400).json({
            error: `Tipo inválido. Debe ser uno de: ${tipoValido.join(", ")}.`,
          });
        }
      }

      // Verificar duplicados si cambió título o fecha
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
            error: "Ya existe una película con ese título y fecha de estreno.",
          });
        }
      }

      if (req.body.titulo) req.body.titulo = req.body.titulo.trim();
      return next();
    }

    // ----------------------------------------------------
    // 📌 Otros métodos (GET, DELETE)
    // ----------------------------------------------------
    next();
  } catch (error) {
    console.error("❌ Error en validación de película:", error);
    res
      .status(500)
      .json({ error: "Error interno en la validación de película." });
  }
};
