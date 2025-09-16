const { OrdenCombo, OrdenCompra, Combo } = require("../models");

// 📌 Obtener combos de orden
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
          attributes: ["id", "fecha_compra", "id_usuario"],
        },
        { model: Combo, attributes: ["id", "nombre", "descripcion", "precio"] },
      ],
    });

    res.json(combos);
  } catch (error) {
    console.error(error);
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

    if (!id_orden_compra || !id_combo || !cantidad || !precio_unitario) {
      return res.status(400).json({
        error:
          "id_orden_compra, id_combo, cantidad y precio_unitario son obligatorios",
      });
    }

    if (descuento < 0 || parseFloat(descuento) > parseFloat(precio_unitario)) {
      return res.status(400).json({
        error:
          "El descuento no puede ser negativo ni mayor que el precio unitario",
      });
    }

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

    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
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
      return res.status(404).json({ error: "Combo no encontrado" });
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
    if (
      combo.OrdenCompra.estado === "pagada" ||
      combo.OrdenCompra.estado === "procesada"
    ) {
      return res
        .status(400)
        .json({
          error:
            "No se puede eliminar un combo de una orden ya pagada o procesada",
        });
    }

    await combo.destroy();
    res.json({ mensaje: "Combo de orden eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar combo de orden" });
  }
};
