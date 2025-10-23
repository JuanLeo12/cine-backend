const {
  OrdenCompra,
  Usuario,
  Funcion,
  OrdenTicket,
  OrdenCombo,
  Ticket,
  AsientoFuncion,
  Pago,
  TipoTicket,
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
      { model: TipoTicket, as: "tipoTicket", attributes: ["id", "nombre"] },
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

    // Solo listar órdenes no canceladas
    where.estado = { [Op.ne]: "cancelada" };

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
    const orden = await OrdenCompra.findOne({
      where: { 
        id: req.params.id,
        estado: { [Op.ne]: "cancelada" }
      },
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
      estado: "pendiente",
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

// 📌 Confirmar orden de compra (pago simulado)
exports.confirmarOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tickets = [], 
      combos = [], 
      metodo_pago,
      asientos = [] // [{ fila, numero }]
    } = req.body;

    const orden = await OrdenCompra.findOne({
      where: { 
        id, 
        id_usuario: req.user.id,
        estado: "pendiente" 
      },
      include: [{ model: Funcion, as: "funcion" }],
    });

    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada o ya procesada" });
    }

    // Verificar que los asientos estén bloqueados por este usuario
    if (orden.id_funcion && asientos.length > 0) {
      for (const { fila, numero } of asientos) {
        const asiento = await AsientoFuncion.findOne({
          where: { 
            id_funcion: orden.id_funcion, 
            fila, 
            numero,
            estado: "bloqueado",
            id_usuario_bloqueo: req.user.id
          },
        });

        if (!asiento) {
          return res.status(400).json({ 
            error: `El asiento ${fila}${numero} no está disponible o el bloqueo expiró` 
          });
        }
      }
    }

    // Calcular total
    let montoTotal = 0;

    // Procesar tickets
    for (const item of tickets) {
      const tipoTicket = await TipoTicket.findByPk(item.id_tipo_ticket);
      if (!tipoTicket) {
        return res.status(404).json({ error: `Tipo de ticket ${item.id_tipo_ticket} no encontrado` });
      }

      const subtotal = tipoTicket.precio_base * item.cantidad;
      montoTotal += subtotal;

      await OrdenTicket.create({
        id_orden_compra: orden.id,
        id_tipo_ticket: item.id_tipo_ticket,
        cantidad: item.cantidad,
        precio_unitario: tipoTicket.precio_base,
        descuento: 0,
      });
    }

    // Procesar combos
    for (const item of combos) {
      const combo = await Combo.findByPk(item.id_combo);
      if (!combo) {
        return res.status(404).json({ error: `Combo ${item.id_combo} no encontrado` });
      }

      const subtotal = combo.precio * item.cantidad;
      montoTotal += subtotal;

      await OrdenCombo.create({
        id_orden_compra: orden.id,
        id_combo: item.id_combo,
        cantidad: item.cantidad,
        precio_unitario: combo.precio,
        descuento: 0,
      });
    }

    // Marcar asientos como OCUPADOS definitivamente
    if (orden.id_funcion && asientos.length > 0) {
      for (const { fila, numero } of asientos) {
        await AsientoFuncion.update(
          { 
            estado: "ocupado",
            id_usuario_bloqueo: req.user.id,
            bloqueo_expira_en: null // Ya no expira
          },
          { 
            where: { 
              id_funcion: orden.id_funcion, 
              fila, 
              numero 
            } 
          }
        );

        // Crear registro de ticket con asiento
        const tipoTicketAdulto = await TipoTicket.findOne({ where: { nombre: "Adulto" } });
        await Ticket.create({
          id_orden_ticket: (await OrdenTicket.findOne({ 
            where: { id_orden_compra: orden.id },
            order: [['id', 'ASC']]
          })).id,
          id_funcion: orden.id_funcion,
          id_asiento_funcion: (await AsientoFuncion.findOne({
            where: { id_funcion: orden.id_funcion, fila, numero }
          })).id,
          precio: tipoTicketAdulto.precio_base,
        });
      }
    }

    // Registrar pago simulado
    const pago = await Pago.create({
      id_orden_compra: orden.id,
      id_metodo_pago: metodo_pago || 1,
      monto_total: montoTotal,
      estado_pago: "pagado",
      fecha_pago: new Date(),
    });

    // Actualizar orden a "pagada"
    await orden.update({ 
      estado: "pagada",
      monto_total: montoTotal 
    });

    // Cargar orden completa
    const ordenCompleta = await OrdenCompra.findByPk(orden.id, {
      include: ordenInclude,
    });

    res.json({
      mensaje: "✅ Compra confirmada exitosamente (simulación)",
      orden: ordenCompleta,
      pago: {
        ...pago.toJSON(),
        nota: "Este es un pago simulado. No se procesó ningún cargo real."
      }
    });
  } catch (error) {
    console.error("Error confirmarOrden:", error);
    res.status(500).json({ error: "Error al confirmar orden de compra" });
  }
};

// 📌 Cancelar orden de compra (soft delete)
exports.cancelarOrden = async (req, res) => {
  try {
    const orden = await OrdenCompra.findOne({
      where: {
        id: req.params.id,
        estado: { [Op.ne]: "cancelada" }
      },
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

    // Si ya está pagada, no se puede cancelar
    if (orden.estado === "pagada") {
      return res
        .status(400)
        .json({ error: "No se puede cancelar una orden ya pagada" });
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

    await orden.update({ estado: "cancelada" });
    res.json({ mensaje: "Orden cancelada y asientos liberados correctamente" });
  } catch (error) {
    console.error("Error cancelarOrden:", error);
    res.status(500).json({ error: "Error al cancelar orden de compra" });
  }
};
