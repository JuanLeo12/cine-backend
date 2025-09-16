const {
  Pago,
  OrdenCompra,
  MetodoPago,
  Usuario,
  Funcion,
} = require("../models");

// 📌 Obtener todos los pagos
exports.listarPagos = async (req, res) => {
  try {
    const where = {};

    // Si no es admin, filtrar por pagos de órdenes o funciones del usuario
    if (req.user.rol !== "admin") {
      where[Symbol.for("or")] = [
        { "$OrdenCompra.id_usuario$": req.user.id },
        { "$Funcion.id_cliente_corporativo$": req.user.id },
      ];
    }

    const pagos = await Pago.findAll({
      where,
      include: [
        {
          model: OrdenCompra,
          include: [{ model: Usuario, attributes: ["id", "nombre", "email"] }],
        },
        {
          model: Funcion,
          attributes: [
            "id",
            "fecha",
            "hora",
            "es_privada",
            "id_cliente_corporativo",
          ],
          include: [
            {
              model: Usuario,
              as: "clienteCorporativo",
              attributes: ["id", "nombre"],
            },
          ],
        },
        { model: MetodoPago, attributes: ["id", "nombre"] },
      ],
    });

    res.json(pagos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener pagos" });
  }
};

// 📌 Obtener un pago por ID
exports.obtenerPago = async (req, res) => {
  try {
    const pago = await Pago.findByPk(req.params.id, {
      include: [
        {
          model: OrdenCompra,
          include: [{ model: Usuario, attributes: ["id", "nombre", "email"] }],
        },
        {
          model: Funcion,
          attributes: [
            "id",
            "fecha",
            "hora",
            "es_privada",
            "id_cliente_corporativo",
          ],
          include: [
            {
              model: Usuario,
              as: "clienteCorporativo",
              attributes: ["id", "nombre"],
            },
          ],
        },
        { model: MetodoPago, attributes: ["id", "nombre"] },
      ],
    });

    if (!pago) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    // Validar propiedad si no es admin
    const esPropietarioOrden =
      pago.OrdenCompra && pago.OrdenCompra.id_usuario === req.user.id;
    const esPropietarioFuncion =
      pago.Funcion && pago.Funcion.id_cliente_corporativo === req.user.id;

    if (
      req.user.rol !== "admin" &&
      !esPropietarioOrden &&
      !esPropietarioFuncion
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver este pago" });
    }

    res.json(pago);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener pago" });
  }
};

// 📌 Registrar nuevo pago
exports.crearPago = async (req, res) => {
  try {
    const {
      id_orden_compra,
      id_funcion,
      id_metodo_pago,
      monto_total,
      estado_pago = "completado",
    } = req.body;

    if ((!id_orden_compra && !id_funcion) || !id_metodo_pago || !monto_total) {
      return res.status(400).json({
        error:
          "Debes indicar orden de compra o función, método de pago y monto total",
      });
    }

    // Validar existencia de MetodoPago
    const metodo = await MetodoPago.findByPk(id_metodo_pago);
    if (!metodo) {
      return res.status(404).json({ error: "Método de pago no encontrado" });
    }

    // Validar existencia y propiedad de OrdenCompra
    if (id_orden_compra) {
      const orden = await OrdenCompra.findByPk(id_orden_compra);
      if (!orden) {
        return res.status(404).json({ error: "Orden de compra no encontrada" });
      }
      if (req.user.rol !== "admin" && orden.id_usuario !== req.user.id) {
        return res
          .status(403)
          .json({
            error: "No puedes registrar un pago para una orden que no es tuya",
          });
      }
    }

    // Validar existencia y propiedad de Funcion
    if (id_funcion) {
      const funcion = await Funcion.findByPk(id_funcion);
      if (!funcion) {
        return res.status(404).json({ error: "Función no encontrada" });
      }
      if (
        req.user.rol !== "admin" &&
        funcion.id_cliente_corporativo !== req.user.id
      ) {
        return res
          .status(403)
          .json({
            error:
              "No puedes registrar un pago para una función que no es tuya",
          });
      }
    }

    const nuevo = await Pago.create({
      id_orden_compra: id_orden_compra || null,
      id_funcion: id_funcion || null,
      id_metodo_pago,
      monto_total,
      estado_pago,
      fecha_pago: new Date(),
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar pago" });
  }
};
