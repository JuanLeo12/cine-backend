const { MetodoPago, Pago } = require("../models");
const { validarMetodoPago } = require("../utils/validacionesMetodoPago");

// 📌 Listar métodos de pago
exports.listarMetodos = async (req, res) => {
  try {
    const metodos = await MetodoPago.findAll({
      attributes: ["id", "nombre"],
      include: [
        {
          model: Pago,
          as: "pagos", // ✅ alias correcto
          attributes: ["id", "monto_total", "estado_pago"],
        },
      ],
      order: [["nombre", "ASC"]],
    });
    res.json(metodos);
  } catch (error) {
    console.error("Error listarMetodos:", error);
    res.status(500).json({ error: "Error al obtener métodos de pago" });
  }
};

// 📌 Obtener método de pago por ID
exports.obtenerMetodo = async (req, res) => {
  try {
    const metodo = await MetodoPago.findByPk(req.params.id, {
      include: [
        {
          model: Pago,
          as: "pagos", // ✅ alias correcto
          attributes: ["id", "monto_total", "estado_pago"],
        },
      ],
    });

    if (!metodo) {
      return res.status(404).json({ error: "Método de pago no encontrado" });
    }
    res.json(metodo);
  } catch (error) {
    console.error("Error obtenerMetodo:", error);
    res.status(500).json({ error: "Error al obtener método de pago" });
  }
};

// 📌 Crear método de pago
exports.crearMetodo = async (req, res) => {
  try {
    const { nombre } = req.body;
    const errores = validarMetodoPago({ nombre });
    if (errores.length > 0) return res.status(400).json({ errores });

    const existe = await MetodoPago.findOne({
      where: { nombre: nombre.trim() },
    });
    if (existe) {
      return res.status(409).json({ error: "El método de pago ya existe" });
    }

    const nuevo = await MetodoPago.create({ nombre: nombre.trim() });
    res.status(201).json({
      mensaje: "Método de pago registrado correctamente",
      metodo: nuevo,
    });
  } catch (error) {
    console.error("Error crearMetodo:", error);
    res.status(500).json({ error: "Error al registrar método de pago" });
  }
};

// 📌 Actualizar método de pago
exports.actualizarMetodo = async (req, res) => {
  try {
    const metodo = await MetodoPago.findByPk(req.params.id);
    if (!metodo) {
      return res.status(404).json({ error: "Método de pago no encontrado" });
    }

    const { nombre } = req.body;
    const errores = validarMetodoPago({ nombre }, true);
    if (errores.length > 0) return res.status(400).json({ errores });

    if (nombre) {
      const existe = await MetodoPago.findOne({
        where: { nombre: nombre.trim() },
      });
      if (existe && existe.id !== metodo.id) {
        return res
          .status(409)
          .json({ error: "Ya existe otro método de pago con ese nombre" });
      }
    }

    await metodo.update({ nombre: nombre?.trim() || metodo.nombre });
    res.json({
      mensaje: "Método de pago actualizado correctamente",
      metodo,
    });
  } catch (error) {
    console.error("Error actualizarMetodo:", error);
    res.status(500).json({ error: "Error al actualizar método de pago" });
  }
};

// 📌 Eliminar método de pago
exports.eliminarMetodo = async (req, res) => {
  try {
    const metodo = await MetodoPago.findByPk(req.params.id);
    if (!metodo) {
      return res.status(404).json({ error: "Método de pago no encontrado" });
    }

    const asociado = await Pago.findOne({
      where: { id_metodo_pago: metodo.id },
    });
    if (asociado) {
      return res.status(400).json({
        error: "No se puede eliminar un método de pago en uso",
      });
    }

    await metodo.destroy();
    res.json({ mensaje: "Método de pago eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminarMetodo:", error);
    res.status(500).json({ error: "Error al eliminar método de pago" });
  }
};
