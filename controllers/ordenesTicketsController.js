const { OrdenTicket, OrdenCompra, TipoUsuario } = require("../models");
const { validarOrdenTicket } = require("../utils/validacionesOrdenTicket");

// 📌 Listar tickets de orden
exports.listarTickets = async (req, res) => {
  try {
    const where = {};
    if (req.user.rol !== "admin") {
      where["$OrdenCompra.id_usuario$"] = req.user.id;
    }

    const tickets = await OrdenTicket.findAll({
      where,
      attributes: [
        "id",
        "id_orden_compra",
        "id_tipo_usuario",
        "cantidad",
        "precio_unitario",
        "descuento",
      ],
      include: [
        {
          model: OrdenCompra,
          attributes: ["id", "fecha_compra", "id_usuario"],
        },
        { model: TipoUsuario, attributes: ["id", "nombre"] },
      ],
      order: [["id", "DESC"]],
    });

    res.json(tickets);
  } catch (error) {
    console.error("Error listarTickets:", error);
    res.status(500).json({ error: "Error al obtener tickets de orden" });
  }
};

// 📌 Crear nuevo ticket de orden
exports.crearTicket = async (req, res) => {
  try {
    const {
      id_orden_compra,
      id_tipo_usuario,
      cantidad,
      precio_unitario,
      descuento = 0,
    } = req.body;

    const errores = validarOrdenTicket({
      id_orden_compra,
      id_tipo_usuario,
      cantidad,
      precio_unitario,
      descuento,
    });
    if (errores.length > 0) return res.status(400).json({ errores });

    // Validar existencia de orden
    const orden = await OrdenCompra.findByPk(id_orden_compra);
    if (!orden)
      return res.status(404).json({ error: "Orden de compra no encontrada" });

    // Verificar propiedad si no es admin
    if (req.user.rol !== "admin" && orden.id_usuario !== req.user.id) {
      return res
        .status(403)
        .json({
          error: "No puedes agregar tickets a una orden que no es tuya",
        });
    }

    // Validar existencia de TipoUsuario
    const tipo = await TipoUsuario.findByPk(id_tipo_usuario);
    if (!tipo)
      return res.status(404).json({ error: "Tipo de usuario no encontrado" });

    const nuevo = await OrdenTicket.create({
      id_orden_compra,
      id_tipo_usuario,
      cantidad,
      precio_unitario,
      descuento,
    });

    res.status(201).json({
      mensaje: "Ticket agregado correctamente a la orden",
      ticket: nuevo,
    });
  } catch (error) {
    console.error("Error crearTicket:", error);
    res.status(500).json({ error: "Error al registrar ticket de orden" });
  }
};

// 📌 Eliminar ticket de orden
exports.eliminarTicket = async (req, res) => {
  try {
    const ticket = await OrdenTicket.findByPk(req.params.id, {
      include: [{ model: OrdenCompra, attributes: ["id_usuario", "estado"] }],
    });

    if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });

    if (
      req.user.rol !== "admin" &&
      ticket.OrdenCompra.id_usuario !== req.user.id
    ) {
      return res
        .status(403)
        .json({
          error: "No puedes eliminar tickets de una orden que no es tuya",
        });
    }

    if (["pagada", "procesada"].includes(ticket.OrdenCompra.estado)) {
      return res.status(400).json({
        error:
          "No se puede eliminar un ticket de una orden ya pagada o procesada",
      });
    }

    await ticket.destroy();
    res.json({ mensaje: "Ticket de orden eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminarTicket:", error);
    res.status(500).json({ error: "Error al eliminar ticket de orden" });
  }
};
