const { OrdenCombo, OrdenCompra, Combo } = require("../models");
const { validarOrdenCombo } = require("../utils/validacionesOrdenCombo");

// 📌 Listar combos de orden
exports.listarCombos = async (req, res) => {
  try {
    const where = {};

    // Si no es admin, filtrar por órdenes del usuario
    if (req.user.rol !== "admin") {
      where["$OrdenCompra.id_usuario$"] = req.user.id;
    }

    const combos = await OrdenCombo.findAll({
      where,
      attributes: [
        "id",
        "id_orden_compra",
        "id_combo",
        "cantidad",
        "precio_unitario",
        "descuento",
      ],
      include: [
        {
          model: OrdenCompra,
          attributes: ["id", "fecha_compra", "id_usuario", "estado"],
        },
        {
          model: Combo,
          attributes: ["id", "nombre", "descripcion", "precio"],
        },
      ],
      order: [["id", "ASC"]],
    });

    res.json(combos);
  } catch (error) {
    console.error("Error listarCombos:", error);
    res.status(500).json({ error: "Error al obtener combos de orden" });
  }
};

// 📌 Crear nuevo combo de orden
exports.crearCombo = async (req, res) => {
  try {
    const {
      id_orden_compra,
      id_combo,
      cantidad,
      precio_unitario,
      descuento = 0,
    } = req.body;

    const errores = validarOrdenCombo({
      id_orden_compra,
      id_combo,
      cantidad,
      precio_unitario,
      descuento,
    });
    if (errores.length > 0) return res.status(400).json({ errores });

    // Validar existencia de OrdenCompra
    const orden = await OrdenCompra.findByPk(id_orden_compra);
    if (!orden) {
      return res.status(404).json({ error: "Orden de compra no encontrada" });
    }

    // Si no es admin, validar que la orden sea del usuario
    if (req.user.rol !== "admin" && orden.id_usuario !== req.user.id) {
      return res
        .status(403)
        .json({ error: "No puedes agregar combos a una orden que no es tuya" });
    }

    // Validar existencia de Combo
    const combo = await Combo.findByPk(id_combo);
    if (!combo) {
      return res.status(404).json({ error: "Combo no encontrado" });
    }

    const nuevo = await OrdenCombo.create({
      id_orden_compra,
      id_combo,
      cantidad,
      precio_unitario,
      descuento,
    });

    res
      .status(201)
      .json({
        mensaje: "Combo agregado a la orden correctamente",
        ordenCombo: nuevo,
      });
  } catch (error) {
    console.error("Error crearCombo:", error);
    res.status(500).json({ error: "Error al registrar combo de orden" });
  }
};

// 📌 Eliminar combo de orden
exports.eliminarCombo = async (req, res) => {
  try {
    const combo = await OrdenCombo.findByPk(req.params.id, {
      include: [{ model: OrdenCompra, attributes: ["id_usuario", "estado"] }],
    });

    if (!combo) {
      return res.status(404).json({ error: "Combo de orden no encontrado" });
    }

    // Si no es admin, validar que la orden sea del usuario
    if (
      req.user.rol !== "admin" &&
      combo.OrdenCompra.id_usuario !== req.user.id
    ) {
      return res
        .status(403)
        .json({
          error: "No puedes eliminar combos de una orden que no es tuya",
        });
    }

    // Evitar eliminar si la orden ya está pagada/procesada
    if (["pagada", "procesada"].includes(combo.OrdenCompra.estado)) {
      return res.status(400).json({
        error:
          "No se puede eliminar un combo de una orden ya pagada o procesada",
      });
    }

    await combo.destroy();
    res.json({ mensaje: "Combo de orden eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminarCombo:", error);
    res.status(500).json({ error: "Error al eliminar combo de orden" });
  }
};
