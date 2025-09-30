const { Pelicula, Sala } = require("../models");

exports.validarFuncion = async (req, res, next) => {
  try {
    const {
      id_pelicula,
      id_sala,
      fecha,
      hora,
      es_privada,
      precio_corporativo,
      id_cliente_corporativo,
    } = req.body;

    if (!id_pelicula || !id_sala || !fecha || !hora) {
      return res.status(400).json({
        error: "Campos obligatorios: película, sala, fecha y hora",
      });
    }

    // Validar existencia de película
    const pelicula = await Pelicula.findByPk(id_pelicula);
    if (!pelicula) {
      return res.status(404).json({ error: "Película no encontrada" });
    }

    // Validar existencia de sala
    const sala = await Sala.findByPk(id_sala);
    if (!sala) {
      return res.status(404).json({ error: "Sala no encontrada" });
    }

    // Validaciones de coherencia privada/pública
    if (es_privada) {
      if (!precio_corporativo || !id_cliente_corporativo) {
        return res.status(400).json({
          error:
            "Funciones privadas requieren cliente corporativo y precio corporativo",
        });
      }
    } else {
      if (precio_corporativo || id_cliente_corporativo) {
        return res.status(400).json({
          error:
            "Funciones públicas no deben tener cliente corporativo ni precio corporativo",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error en validaciones de función:", error);
    res.status(500).json({ error: "Error en validación de función" });
  }
};
