const { MetodoPago, Pago } = require("../models");

// 📌 Obtener todos los métodos de pago (público o autenticado)
exports.listarMetodos = async (req, res) => {
  try {
    const metodos = await MetodoPago.findAll({
      attributes: ["id", "nombre"],
    });
    res.json(metodos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener métodos de pago" });
  }
};

// 📌 Obtener un método de pago por ID (público o autenticado)
exports.obtenerMetodo = async (req, res) => {
  try {
    const metodo = await MetodoPago.findByPk(req.params.id);
    if (!metodo) {
      return res.status(404).json({ error: "Método de pago no encontrado" });
    }
    res.json(metodo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener método de pago" });
  }
};

// 📌 Crear nuevo método de pago (solo admin)
exports.crearMetodo = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para crear métodos de pago" });
    }

    const { nombre } = req.body;

    if (!nombre || nombre.trim() === "") {
      return res
        .status(400)
        .json({ error: "El nombre del método es obligatorio" });
    }

    const existe = await MetodoPago.findOne({ where: { nombre } });
    if (existe) {
      return res.status(409).json({ error: "El método de pago ya existe" });
    }

    const nuevo = await MetodoPago.create({ nombre: nombre.trim() });
    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar método de pago" });
  }
};

// 📌 Actualizar método de pago (solo admin)
exports.actualizarMetodo = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar métodos de pago" });
    }

    const metodo = await MetodoPago.findByPk(req.params.id);
    if (!metodo) {
      return res.status(404).json({ error: "Método de pago no encontrado" });
    }

    const { nombre } = req.body;

    if (nombre && nombre.trim() === "") {
      return res.status(400).json({ error: "El nombre no puede estar vacío" });
    }

    if (nombre) {
      const existe = await MetodoPago.findOne({ where: { nombre } });
      if (existe && existe.id !== metodo.id) {
        return res
          .status(409)
          .json({ error: "Ya existe otro método de pago con ese nombre" });
      }
    }

    await metodo.update(req.body);
    res.json(metodo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar método de pago" });
  }
};

// 📌 Eliminar método de pago (solo admin)
exports.eliminarMetodo = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar métodos de pago" });
    }

    const metodo = await MetodoPago.findByPk(req.params.id);
    if (!metodo) {
      return res.status(404).json({ error: "Método de pago no encontrado" });
    }

    // Validar si está asociado a algún pago
    const asociado = await Pago.findOne({
      where: { id_metodo_pago: metodo.id },
    });
    if (asociado) {
      return res
        .status(400)
        .json({ error: "No se puede eliminar un método de pago en uso" });
    }

    await metodo.destroy();
    res.json({ mensaje: "Método de pago eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar método de pago" });
  }
};
