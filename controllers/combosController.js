const { Combo, OrdenCombo } = require("../models");

// 📌 Obtener todos los combos (público)
exports.listarCombos = async (req, res) => {
  try {
    const combos = await Combo.findAll({
      attributes: ["id", "nombre", "descripcion", "precio"],
    });
    res.json(combos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener combos" });
  }
};

// 📌 Obtener un combo por ID (público)
exports.obtenerCombo = async (req, res) => {
  try {
    const combo = await Combo.findByPk(req.params.id);
    if (!combo) {
      return res.status(404).json({ error: "Combo no encontrado" });
    }
    res.json(combo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener combo" });
  }
};

// 📌 Crear nuevo combo (solo admin)
exports.crearCombo = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para crear combos" });
    }

    const { nombre, descripcion, precio } = req.body;

    if (!nombre || precio == null) {
      return res
        .status(400)
        .json({ error: "Nombre y precio son obligatorios" });
    }

    if (precio <= 0) {
      return res
        .status(400)
        .json({ error: "El precio debe ser mayor que cero" });
    }

    const existe = await Combo.findOne({ where: { nombre } });
    if (existe) {
      return res.status(409).json({ error: "El combo ya existe" });
    }

    const nuevo = await Combo.create({ nombre, descripcion, precio });
    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar combo" });
  }
};

// 📌 Actualizar combo (solo admin)
exports.actualizarCombo = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar combos" });
    }

    const combo = await Combo.findByPk(req.params.id);
    if (!combo) {
      return res.status(404).json({ error: "Combo no encontrado" });
    }

    const { nombre, precio } = req.body;

    if (precio != null && precio <= 0) {
      return res
        .status(400)
        .json({ error: "El precio debe ser mayor que cero" });
    }

    if (nombre) {
      const existe = await Combo.findOne({ where: { nombre } });
      if (existe && existe.id !== combo.id) {
        return res
          .status(409)
          .json({ error: "Ya existe otro combo con ese nombre" });
      }
    }

    await combo.update(req.body);
    res.json(combo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar combo" });
  }
};

// 📌 Eliminar combo (solo admin)
exports.eliminarCombo = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar combos" });
    }

    const combo = await Combo.findByPk(req.params.id);
    if (!combo) {
      return res.status(404).json({ error: "Combo no encontrado" });
    }

    // Validar si está asociado a alguna orden
    const asociado = await OrdenCombo.findOne({
      where: { id_combo: combo.id },
    });
    if (asociado) {
      return res
        .status(400)
        .json({ error: "No se puede eliminar un combo asociado a órdenes" });
    }

    await combo.destroy();
    res.json({ mensaje: "Combo eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar combo" });
  }
};
