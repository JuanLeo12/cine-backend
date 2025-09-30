const { Sala, Sede } = require("../models");

exports.validarSala = async (req, res, next) => {
  try {
    const { id_sede, nombre, filas, columnas } = req.body;
    const idSala = req.params.id ? parseInt(req.params.id, 10) : null;

    if (!id_sede || !nombre || !filas || !columnas) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    if (filas <= 0 || columnas <= 0) {
      return res
        .status(400)
        .json({ error: "Filas y columnas deben ser mayores que cero" });
    }

    // 📌 Validar sede existente
    const sede = await Sede.findByPk(id_sede);
    if (!sede) {
      return res.status(404).json({ error: "Sede no encontrada" });
    }

    // 📌 Validar nombre único dentro de la sede
    const existe = await Sala.findOne({
      where: { id_sede, nombre: nombre.trim() },
    });

    if (existe && existe.id !== idSala) {
      return res.status(409).json({
        error: "Ya existe una sala con ese nombre en esta sede",
      });
    }

    req.body.nombre = nombre.trim(); // normalizar
    next();
  } catch (error) {
    console.error("Error en validación de sala:", error);
    res.status(500).json({ error: "Error en validación de sala" });
  }
};
