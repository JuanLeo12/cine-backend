const { ValeCorporativo, Pago, OrdenCompra } = require("../models");

// 📌 Obtener todos los vales corporativos
exports.listarVales = async (req, res) => {
  try {
    const where = {};

    // Si no es admin, filtrar por vales asociados a sus pagos u órdenes
    if (req.user.rol !== "admin") {
      where["$OrdenCompra.id_usuario$"] = req.user.id;
    }

    const vales = await ValeCorporativo.findAll({
      where,
      attributes: [
        "id",
        "codigo",
        "tipo",
        "valor",
        "fecha_expiracion",
        "usado",
      ],
      include: [
        { model: Pago, attributes: ["id", "monto_total", "estado_pago"] },
        {
          model: OrdenCompra,
          attributes: ["id", "fecha_compra", "id_usuario"],
        },
      ],
    });
    res.json(vales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener vales corporativos" });
  }
};

// 📌 Crear nuevo vale corporativo
exports.crearVale = async (req, res) => {
  try {
    const { codigo, tipo, valor, fecha_expiracion, id_pago, id_orden_compra } =
      req.body;

    if (!codigo || !tipo || !valor || !fecha_expiracion) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    if (valor <= 0) {
      return res
        .status(400)
        .json({ error: "El valor debe ser mayor que cero" });
    }

    if (new Date(fecha_expiracion) <= new Date()) {
      return res
        .status(400)
        .json({ error: "La fecha de expiración debe ser futura" });
    }

    const existe = await ValeCorporativo.findOne({ where: { codigo } });
    if (existe) {
      return res.status(409).json({ error: "El código ya existe" });
    }

    // Validar pago si se envía
    if (id_pago) {
      const pago = await Pago.findByPk(id_pago, {
        include: [{ model: OrdenCompra, attributes: ["id_usuario"] }],
      });
      if (!pago) {
        return res.status(404).json({ error: "Pago no encontrado" });
      }
      if (
        req.user.rol !== "admin" &&
        pago.OrdenCompra?.id_usuario !== req.user.id
      ) {
        return res
          .status(403)
          .json({
            error: "No puedes asociar un vale a un pago que no es tuyo",
          });
      }
    }

    // Validar orden si se envía
    if (id_orden_compra) {
      const orden = await OrdenCompra.findByPk(id_orden_compra);
      if (!orden) {
        return res.status(404).json({ error: "Orden de compra no encontrada" });
      }
      if (req.user.rol !== "admin" && orden.id_usuario !== req.user.id) {
        return res
          .status(403)
          .json({
            error: "No puedes asociar un vale a una orden que no es tuya",
          });
      }
    }

    const nuevo = await ValeCorporativo.create({
      codigo,
      tipo,
      valor,
      fecha_expiracion,
      usado: false,
      id_pago: id_pago || null,
      id_orden_compra: id_orden_compra || null,
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear vale corporativo" });
  }
};

// 📌 Eliminar vale corporativo
exports.eliminarVale = async (req, res) => {
  try {
    const vale = await ValeCorporativo.findByPk(req.params.id, {
      include: [{ model: OrdenCompra, attributes: ["id_usuario"] }],
    });
    if (!vale) {
      return res.status(404).json({ error: "Vale no encontrado" });
    }

    // Validar propiedad o rol admin
    if (
      req.user.rol !== "admin" &&
      vale.OrdenCompra?.id_usuario !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar este vale" });
    }

    if (vale.usado) {
      return res
        .status(403)
        .json({ error: "No se puede eliminar un vale ya usado" });
    }

    await vale.destroy();
    res.json({ mensaje: "Vale corporativo eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar vale corporativo" });
  }
};
