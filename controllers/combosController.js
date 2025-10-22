const { Combo, OrdenCombo } = require("../models");
const { validarCombo } = require("../utils/validacionesCombo");

// 📌 Listar combos
exports.listarCombos = async (req, res) => {
  try {
    const combos = await Combo.findAll({
      where: { estado: "activo" },
      attributes: ["id", "nombre", "descripcion", "precio", "imagen_url"],
      order: [["nombre", "ASC"]],
    });
    res.json(combos);
  } catch (error) {
    console.error("Error listarCombos:", error);
    res.status(500).json({ error: "Error al obtener combos" });
  }
};

// 📌 Obtener combo por ID
exports.obtenerCombo = async (req, res) => {
  try {
    const combo = await Combo.findByPk(req.params.id);
    if (!combo || combo.estado === "inactivo") {
      return res.status(404).json({ error: "Combo no encontrado" });
    }
    res.json(combo);
  } catch (error) {
    console.error("Error obtenerCombo:", error);
    res.status(500).json({ error: "Error al obtener combo" });
  }
};

// 📌 Crear combo
exports.crearCombo = async (req, res) => {
  try {
    const { nombre, descripcion, precio, imagen_url } = req.body;

    const errores = validarCombo({ nombre, precio });
    if (errores.length > 0) return res.status(400).json({ errores });

    const existe = await Combo.findOne({ where: { nombre: nombre.trim() } });
    if (existe) return res.status(409).json({ error: "El combo ya existe" });

    const nuevo = await Combo.create({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      precio,
      imagen_url: imagen_url?.trim() || null,
    });

    res
      .status(201)
      .json({ mensaje: "Combo creado correctamente", combo: nuevo });
  } catch (error) {
    console.error("Error crearCombo:", error);
    res.status(500).json({ error: "Error al registrar combo" });
  }
};

// 📌 Actualizar combo
exports.actualizarCombo = async (req, res) => {
  try {
    const combo = await Combo.findByPk(req.params.id);
    if (!combo) return res.status(404).json({ error: "Combo no encontrado" });

    const { nombre, precio } = req.body;
    const errores = validarCombo({ nombre, precio }, true);
    if (errores.length > 0) return res.status(400).json({ errores });

    if (nombre) {
      const existe = await Combo.findOne({ where: { nombre: nombre.trim() } });
      if (existe && existe.id !== combo.id) {
        return res
          .status(409)
          .json({ error: "Ya existe otro combo con ese nombre" });
      }
    }

    await combo.update({
      ...req.body,
      nombre: nombre?.trim() || combo.nombre,
    });

    res.json({ mensaje: "Combo actualizado correctamente", combo });
  } catch (error) {
    console.error("Error actualizarCombo:", error);
    res.status(500).json({ error: "Error al actualizar combo" });
  }
};

// 📌 Eliminar combo
exports.eliminarCombo = async (req, res) => {
  try {
    const combo = await Combo.findByPk(req.params.id);
    if (!combo) return res.status(404).json({ error: "Combo no encontrado" });

    const asociado = await OrdenCombo.findOne({
      where: { id_combo: combo.id },
    });
    if (asociado) {
      return res
        .status(400)
        .json({ error: "No se puede eliminar un combo asociado a órdenes" });
    }

    await combo.update({ estado: "inactivo" });
    res.json({ mensaje: "Combo inactivado correctamente" });
  } catch (error) {
    console.error("Error eliminarCombo:", error);
    res.status(500).json({ error: "Error al eliminar combo" });
  }
};
