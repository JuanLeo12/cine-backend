const { Ticket, OrdenTicket, AsientoFuncion, Funcion } = require("../models");

// 📌 Listar todos los tickets
exports.listarTickets = async (req, res) => {
  try {
    const where = {};

    // Si no es admin, filtrar por órdenes del usuario
    if (req.user.rol !== "admin") {
      where["$OrdenTicket.OrdenCompra.id_usuario$"] = req.user.id;
    }

    const tickets = await Ticket.findAll({
      where,
      attributes: ["id", "id_orden_ticket", "id_asiento"],
      include: [
        {
          model: OrdenTicket,
          attributes: ["id", "cantidad", "precio_unitario"],
          include: [
            { association: "OrdenCompra", attributes: ["id", "id_usuario"] },
          ],
        },
        {
          model: AsientoFuncion,
          attributes: ["id", "fila", "numero", "estado"],
          include: [{ model: Funcion, attributes: ["id", "fecha", "hora"] }],
        },
      ],
    });
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener tickets" });
  }
};

// 📌 Obtener ticket por ID
exports.obtenerTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        {
          model: OrdenTicket,
          include: [
            { association: "OrdenCompra", attributes: ["id", "id_usuario"] },
          ],
        },
        {
          model: AsientoFuncion,
          include: [{ model: Funcion, attributes: ["id", "fecha", "hora"] }],
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    // Validar propiedad si no es admin
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
    console.error(error);
    res.status(500).json({ error: "Error al obtener ticket" });
  }
};

// 📌 Crear nuevo ticket
exports.crearTicket = async (req, res) => {
  try {
    const { id_orden_ticket, id_asiento } = req.body;

    if (!id_orden_ticket || !id_asiento) {
      return res.status(400).json({ error: "Campos obligatorios faltantes" });
    }

    // Validar existencia de OrdenTicket
    const ordenTicket = await OrdenTicket.findByPk(id_orden_ticket, {
      include: [
        { association: "OrdenCompra", attributes: ["id", "id_usuario"] },
      ],
    });
    if (!ordenTicket) {
      return res.status(404).json({ error: "Orden de ticket no encontrada" });
    }

    // Validar propiedad de la orden
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

    // Validar existencia de AsientoFuncion
    const asiento = await AsientoFuncion.findByPk(id_asiento);
    if (!asiento) {
      return res.status(404).json({ error: "Asiento no encontrado" });
    }

    // Verificar que el asiento esté disponible o bloqueado por el mismo usuario
    if (
      asiento.estado === "bloqueado" &&
      asiento.id_usuario_bloqueo !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "El asiento está bloqueado por otro usuario" });
    }
    if (asiento.estado !== "libre" && asiento.estado !== "bloqueado") {
      return res
        .status(400)
        .json({
          error: "El asiento no está disponible para asignar un ticket",
        });
    }

    // Evitar duplicados
    const existente = await Ticket.findOne({ where: { id_asiento } });
    if (existente) {
      return res
        .status(409)
        .json({ error: "El asiento ya tiene un ticket asignado" });
    }

    const nuevo = await Ticket.create({ id_orden_ticket, id_asiento });

    // Cambiar estado del asiento a reservado
    await asiento.update({ estado: "reservado" });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar ticket" });
  }
};

// 📌 Eliminar ticket
exports.eliminarTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: AsientoFuncion },
        {
          model: OrdenTicket,
          include: [
            {
              association: "OrdenCompra",
              attributes: ["id", "id_usuario", "estado"],
            },
          ],
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }

    // Validar propiedad si no es admin
    if (
      req.user.rol !== "admin" &&
      ticket.OrdenTicket?.OrdenCompra?.id_usuario !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar este ticket" });
    }

    // Si el asiento está usado, no permitir eliminar
    if (ticket.AsientoFuncion && ticket.AsientoFuncion.estado === "usado") {
      return res
        .status(400)
        .json({ error: "No se puede eliminar un ticket ya utilizado" });
    }

    // Evitar eliminar si la orden ya está pagada/procesada
    if (
      ["pagada", "procesada"].includes(ticket.OrdenTicket?.OrdenCompra?.estado)
    ) {
      return res
        .status(400)
        .json({
          error:
            "No se puede eliminar un ticket de una orden ya pagada o procesada",
        });
    }

    // Liberar asiento si estaba reservado
    if (ticket.AsientoFuncion) {
      await ticket.AsientoFuncion.update({ estado: "libre" });
    }

    await ticket.destroy();
    res.json({ mensaje: "Ticket eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar ticket" });
  }
};
