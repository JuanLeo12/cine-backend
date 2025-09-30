const {
  Ticket,
  OrdenTicket,
  AsientoFuncion,
  Funcion,
  OrdenCompra,
} = require("../models");
const { validarTicket } = require("../utils/validacionesTickets");

const ticketInclude = [
  {
    model: OrdenTicket,
    as: "ordenTicket",
    attributes: ["id", "cantidad", "precio_unitario"],
    include: [
      {
        model: OrdenCompra,
        as: "orden",
        attributes: ["id", "id_usuario", "estado"],
      },
    ],
  },
  {
    model: AsientoFuncion,
    as: "asientoFuncion",
    attributes: ["id", "fila", "numero", "estado", "id_usuario_bloqueo"],
    include: [
      { model: Funcion, as: "funcion", attributes: ["id", "fecha", "hora"] },
    ],
  },
];

// 📌 Listar tickets
exports.listarTickets = async (req, res) => {
  try {
    const where = {};
    if (req.user.rol !== "admin") {
      where["$ordenTicket.orden.id_usuario$"] = req.user.id;
    }

    const tickets = await Ticket.findAll({ where, include: ticketInclude });
    res.json(tickets);
  } catch (error) {
    console.error("Error listarTickets:", error);
    res.status(500).json({ error: "Error al obtener tickets" });
  }
};

// 📌 Obtener ticket por ID
exports.obtenerTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: ticketInclude,
    });
    if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });

    if (
      req.user.rol !== "admin" &&
      ticket.ordenTicket?.orden?.id_usuario !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver este ticket" });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Error obtenerTicket:", error);
    res.status(500).json({ error: "Error al obtener ticket" });
  }
};

// 📌 Crear ticket
exports.crearTicket = async (req, res) => {
  try {
    const { id_orden_ticket, id_asiento } = req.body;

    const errores = validarTicket({ id_orden_ticket, id_asiento });
    if (errores.length > 0) return res.status(400).json({ errores });

    const ordenTicket = await OrdenTicket.findByPk(id_orden_ticket, {
      include: [
        { model: OrdenCompra, as: "orden", attributes: ["id", "id_usuario"] },
      ],
    });
    if (!ordenTicket)
      return res.status(404).json({ error: "Orden de ticket no encontrada" });

    if (
      req.user.rol !== "admin" &&
      ordenTicket.orden.id_usuario !== req.user.id
    ) {
      return res
        .status(403)
        .json({
          error: "No puedes agregar tickets a una orden que no es tuya",
        });
    }

    const asiento = await AsientoFuncion.findByPk(id_asiento);
    if (!asiento)
      return res.status(404).json({ error: "Asiento no encontrado" });

    if (
      asiento.estado === "bloqueado" &&
      asiento.id_usuario_bloqueo !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "El asiento está bloqueado por otro usuario" });
    }
    if (!["libre", "bloqueado"].includes(asiento.estado)) {
      return res.status(400).json({ error: "El asiento no está disponible" });
    }

    const existente = await Ticket.findOne({ where: { id_asiento } });
    if (existente)
      return res
        .status(409)
        .json({ error: "El asiento ya tiene un ticket asignado" });

    const nuevo = await Ticket.create({ id_orden_ticket, id_asiento });

    // marcar asiento como ocupado y limpiar bloqueo
    await asiento.update({
      estado: "ocupado",
      id_usuario_bloqueo: null,
      bloqueo_expira_en: null,
    });

    res.status(201).json({ mensaje: "Ticket creado con éxito", ticket: nuevo });
  } catch (error) {
    console.error("Error crearTicket:", error);
    res.status(500).json({ error: "Error al registrar ticket" });
  }
};

// 📌 Eliminar ticket
exports.eliminarTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: ticketInclude,
    });
    if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });

    if (
      req.user.rol !== "admin" &&
      ticket.ordenTicket?.orden?.id_usuario !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar este ticket" });
    }

    // si el asiento ya está ocupado (confirmado), no permitir eliminar
    if (ticket.asientoFuncion?.estado === "ocupado") {
      return res
        .status(400)
        .json({ error: "No se puede eliminar un ticket ya ocupado" });
    }

    if (["pagada", "procesada"].includes(ticket.ordenTicket?.orden?.estado)) {
      return res.status(400).json({
        error:
          "No se puede eliminar un ticket de una orden ya pagada o procesada",
      });
    }

    if (ticket.asientoFuncion) {
      await ticket.asientoFuncion.update({
        estado: "libre",
        id_usuario_bloqueo: null,
        bloqueo_expira_en: null,
      });
    }

    await ticket.destroy();
    res.json({ mensaje: "Ticket eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminarTicket:", error);
    res.status(500).json({ error: "Error al eliminar ticket" });
  }
};
