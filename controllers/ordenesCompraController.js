const {
  OrdenCompra,
  Usuario,
  Funcion,
  OrdenTicket,
  OrdenCombo,
  Ticket,
  AsientoFuncion,
  Pago,
  TipoUsuario,
  Combo,
} = require("../models");
const { validarOrdenCompra } = require("../utils/validacionesOrdenCompra");
const { Op } = require("sequelize");

const ordenInclude = [
  { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
  {
    model: Funcion,
    as: "funcion",
    include: [
      {
        model: Usuario,
        as: "clienteCorporativo",
        attributes: ["id", "nombre"],
      },
    ],
  },
  {
    model: OrdenTicket,
    as: "ordenTickets",
    attributes: ["id", "cantidad", "precio_unitario", "descuento"],
    include: [
      { model: TipoUsuario, as: "tipoUsuario", attributes: ["id", "nombre"] },
    ],
  },
  {
    model: OrdenCombo,
    as: "ordenCombos",
    attributes: ["id", "cantidad", "precio_unitario", "descuento"],
    include: [{ model: Combo, as: "combo", attributes: ["id", "nombre"] }],
  },
  {
    model: Pago,
    as: "pago",
    attributes: ["id", "monto_total", "estado_pago", "fecha_pago"],
  },
];

// 📌 Listar órdenes
exports.listarOrdenes = async (req, res) => {
  try {
    const where = {};
    if (req.user.rol !== "admin") {
      where.id_usuario = req.user.id;
    }

    const ordenes = await OrdenCompra.findAll({
      where,
      include: ordenInclude,
      order: [["fecha_compra", "DESC"]],
    });

    res.json(ordenes);
  } catch (error) {
    console.error("Error listarOrdenes:", error);
    res.status(500).json({ error: "Error al obtener órdenes de compra" });
  }
};

// 📌 Obtener una orden por ID
exports.obtenerOrden = async (req, res) => {
  try {
    const orden = await OrdenCompra.findByPk(req.params.id, {
      include: ordenInclude,
    });

    if (!orden) return res.status(404).json({ error: "Orden no encontrada" });

    if (req.user.rol !== "admin" && orden.id_usuario !== req.user.id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver esta orden" });
    }

    res.json(orden);
  } catch (error) {
    console.error("Error obtenerOrden:", error);
    res.status(500).json({ error: "Error al obtener orden de compra" });
  }
};

// 📌 Crear nueva orden de compra
exports.crearOrden = async (req, res) => {
  try {
    const { id_funcion, tickets = [], combos = [] } = req.body;

    const errores = validarOrdenCompra({ id_funcion, tickets });
    if (errores.length > 0) return res.status(400).json({ errores });

    if (id_funcion) {
      const funcion = await Funcion.findByPk(id_funcion);
      if (!funcion)
        return res.status(404).json({ error: "Función no encontrada" });

      const fechaHoraFuncion = new Date(`${funcion.fecha}T${funcion.hora}`);
      if (fechaHoraFuncion <= new Date()) {
        return res.status(400).json({
          error:
            "No se puede crear una orden para una función ya iniciada o pasada",
        });
      }
    }

    const nueva = await OrdenCompra.create({
      id_usuario: req.user.id,
      id_funcion: id_funcion || null,
    });

    res.status(201).json({
      mensaje: "Orden creada correctamente",
      orden: nueva,
    });
  } catch (error) {
    console.error("Error crearOrden:", error);
    res.status(500).json({ error: "Error al crear orden de compra" });
  }
};

// 📌 Cancelar orden de compra
exports.cancelarOrden = async (req, res) => {
  try {
    const orden = await OrdenCompra.findByPk(req.params.id, {
      include: [
        {
          model: OrdenTicket,
          as: "ordenTickets",
          include: [
            {
              model: Ticket,
              as: "tickets",
              include: [{ model: AsientoFuncion, as: "asientoFuncion" }],
            },
          ],
        },
        { model: Pago, as: "pago" },
      ],
    });

    if (!orden) return res.status(404).json({ error: "Orden no encontrada" });

    if (req.user.rol !== "admin" && orden.id_usuario !== req.user.id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para cancelar esta orden" });
    }

    // Si ya está pagada o procesada, no se puede cancelar
    if (
      orden.pago &&
      ["pagada", "procesada"].includes(orden.pago.estado_pago)
    ) {
      return res
        .status(400)
        .json({ error: "No se puede cancelar una orden ya pagada/procesada" });
    }

    // Liberar asientos asociados
    for (const ordenTicket of orden.ordenTickets || []) {
      for (const ticket of ordenTicket.tickets || []) {
        if (ticket.asientoFuncion) {
          await ticket.asientoFuncion.update({
            estado: "libre",
            id_usuario_bloqueo: null,
            bloqueo_expira_en: null,
          });
        }
      }
    }

    await orden.destroy();
    res.json({ mensaje: "Orden cancelada y asientos liberados correctamente" });
  } catch (error) {
    console.error("Error cancelarOrden:", error);
    res.status(500).json({ error: "Error al cancelar orden de compra" });
  }
};
