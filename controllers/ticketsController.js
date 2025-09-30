const { Ticket, OrdenTicket, AsientoFuncion, Funcion } = require("../models");
const { validarTicket } = require("../utils/validacionesTickets");

const ticketInclude = [
  {
    model: OrdenTicket,
    attributes: ["id", "cantidad", "precio_unitario"],
    include: [
      {
        association: "OrdenCompra",
        attributes: ["id", "id_usuario", "estado"],
      },
    ],
  },
  {
    model: AsientoFuncion,
    attributes: ["id", "fila", "numero", "estado"],
    include: [{ model: Funcion, attributes: ["id", "fecha", "hora"] }],
  },
];

// 📌 Listar tickets
exports.listarTickets = async (req, res) => {
  try {
    const where = {};
    if (req.user.rol !== "admin") {
      where["$OrdenTicket.OrdenCompra.id_usuario$"] = req.user.id;
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
      ticket.OrdenTicket?.OrdenCompra?.id_usuario !== req.user.id
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
        { association: "OrdenCompra", attributes: ["id", "id_usuario"] },
      ],
    });
    if (!ordenTicket)
      return res.status(404).json({ error: "Orden de ticket no encontrada" });

    if (
      req.user.rol !== "admin" &&
      ordenTicket.OrdenCompra.id_usuario !== req.user.id
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

    // 🔧 CORREGIDO → cambiar asiento a "ocupado"
    await asiento.update({ estado: "ocupado" });

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
      ticket.OrdenTicket?.OrdenCompra?.id_usuario !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar este ticket" });
    }

    // 🔧 CORREGIDO → "usado" → "ocupado"
    if (ticket.AsientoFuncion?.estado === "ocupado") {
      return res
        .status(400)
        .json({ error: "No se puede eliminar un ticket ya ocupado" });
    }

    if (
      ["pagada", "procesada"].includes(ticket.OrdenTicket?.OrdenCompra?.estado)
    ) {
      return res.status(400).json({
        error:
          "No se puede eliminar un ticket de una orden ya pagada o procesada",
      });
    }

    if (ticket.AsientoFuncion)
      await ticket.AsientoFuncion.update({ estado: "libre" });

    await ticket.destroy();
    res.json({ mensaje: "Ticket eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminarTicket:", error);
    res.status(500).json({ error: "Error al eliminar ticket" });
  }
};
