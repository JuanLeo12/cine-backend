const {
  OrdenCompra,
  Usuario,
  Funcion,
  OrdenTicket,
  OrdenCombo,
  Ticket,
  AsientoFuncion,
  Pago,
  MetodoPago,
  TipoTicket,
  Combo,
  Pelicula,
  Sala,
  Sede,
} = require("../models");
const { ValeCorporativo } = require('../models');
const { validarOrdenCompra } = require("../utils/validacionesOrdenCompra");
const { Op } = require("sequelize");

const ordenInclude = [
  { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
  {
    model: Funcion,
    as: "funcion",
    required: false, // LEFT OUTER JOIN - no rompe si la función no existe
    attributes: ["id", "fecha", "hora"],
    include: [
      {
        model: Pelicula,
        as: "pelicula",
        required: false,
        attributes: ["id", "titulo", "duracion"],
      },
      {
        model: Sala,
        as: "sala",
        required: false,
        attributes: ["id", "nombre"],
        include: [
          {
            model: Sede,
            as: "sede",
            required: false,
            attributes: ["id", "nombre", "direccion"],
          },
        ],
      },
    ],
  },
  {
    model: OrdenTicket,
    as: "ordenTickets",
    required: false,
    attributes: ["id", "cantidad", "precio_unitario", "descuento"],
    include: [
      { model: TipoTicket, as: "tipoTicket", required: false, attributes: ["id", "nombre"] },
      {
        model: Ticket,
        as: "tickets",
        required: false,
        attributes: ["id", "id_asiento"],
        include: [
          {
            model: AsientoFuncion,
            as: "asientoFuncion",
            required: false,
            attributes: ["id", "fila", "numero"],
          },
        ],
      },
    ],
  },
  {
    model: OrdenCombo,
    as: "ordenCombos",
    required: false,
    attributes: ["id", "cantidad", "precio_unitario", "descuento"],
    include: [{ model: Combo, as: "combo", required: false, attributes: ["id", "nombre"] }],
  },
  {
    model: Pago,
    as: "pago",
    required: false,
    attributes: ["id", "monto_total", "estado_pago", "fecha_pago", "id_metodo_pago"],
    include: [
      {
        model: MetodoPago,
        as: "metodoPago",
        required: false,
        attributes: ["id", "nombre", "estado"],
      },
    ],
  },
];

// 📌 Listar todas las órdenes (admin ve todas, usuario solo las suyas)
exports.listarOrdenes = async (req, res) => {
  try {
    const where = req.user.rol === 'admin' ? {} : { id_usuario: req.user.id };
    const ordenes = await OrdenCompra.findAll({ where, include: ordenInclude, order: [['createdAt', 'DESC']] });
    res.json(ordenes);
  } catch (error) {
    console.error('Error listarOrdenes:', error);
    res.status(500).json({ error: 'Error al listar órdenes' });
  }
};

// 📌 Obtener orden por ID
exports.obtenerOrden = async (req, res) => {
  try {
    const orden = await OrdenCompra.findByPk(req.params.id, { include: ordenInclude });
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    if (req.user.rol !== 'admin' && orden.id_usuario !== req.user.id) return res.status(403).json({ error: 'No tienes permiso para ver esta orden' });
    res.json(orden);
  } catch (error) {
    console.error('Error obtenerOrden:', error);
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
};

// 📌 Crear nueva orden (estado pendiente)
exports.crearOrden = async (req, res) => {
  try {
    const { id_funcion = null } = req.body;
    const orden = await OrdenCompra.create({ id_usuario: req.user.id, id_funcion, estado: 'pendiente', monto_total: 0 });
    res.status(201).json(orden);
  } catch (error) {
    console.error('Error crearOrden:', error);
    res.status(500).json({ error: 'Error al crear la orden' });
  }
};

// 📌 Listar órdenes
exports.listarOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenCompra.findAll({ include: ordenInclude });
    res.json(ordenes);
  } catch (error) {
    console.error('Error listarOrdenes:', error);
    res.status(500).json({ error: 'Error al listar órdenes' });
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
        asientos = [], // [{ fila, numero }]
        vale_id = null,
      } = req.body;

      console.log('📝 Confirmando orden:', { id_orden: id, id_usuario: req.user.id });

      const orden = await OrdenCompra.findOne({
        where: { id, id_usuario: req.user.id, estado: 'pendiente' },
      });

      if (!orden) {
        console.error('❌ Orden no encontrada:', { id, id_usuario: req.user.id });
        return res.status(404).json({ error: 'Orden no encontrada o ya procesada' });
      }

      // Verificar asientos bloqueados (si aplica)
      if (orden.id_funcion && asientos.length > 0) {
        for (const { fila, numero } of asientos) {
          const asiento = await AsientoFuncion.findOne({
            where: { id_funcion: orden.id_funcion, fila, numero },
          });

          if (!asiento) {
            return res.status(400).json({ error: `El asiento ${fila}${numero} no está disponible` });
          }

          if (asiento.estado === 'ocupado') {
            return res.status(400).json({ error: `El asiento ${fila}${numero} ya fue vendido` });
          }

          if (asiento.estado === 'bloqueado') {
            const bloqueadoPorMi = asiento.id_usuario_bloqueo === req.user.id;
            const ahora = new Date();
            const estaExpirado = asiento.bloqueo_expira_en && new Date(asiento.bloqueo_expira_en) < ahora;

            if (!bloqueadoPorMi) {
              return res.status(400).json({ error: `El asiento ${fila}${numero} está siendo usado por otro cliente` });
            }

            if (bloqueadoPorMi && estaExpirado) {
              await asiento.update({ bloqueo_expira_en: new Date(Date.now() + 5 * 60 * 1000) });
            }
          }
        }
      }

      // Calcular subtotales
      let ticketsSubtotal = 0;
      let combosSubtotal = 0;

      for (const item of tickets) {
        const tipoTicket = await TipoTicket.findByPk(item.id_tipo_ticket);
        if (!tipoTicket) return res.status(404).json({ error: `Tipo de ticket ${item.id_tipo_ticket} no encontrado` });
        ticketsSubtotal += tipoTicket.precio_base * item.cantidad;
      }

      for (const item of combos) {
        const combo = await Combo.findByPk(item.id_combo);
        if (!combo) return res.status(404).json({ error: `Combo ${item.id_combo} no encontrado` });
        combosSubtotal += combo.precio * item.cantidad;
      }

      let montoTotal = ticketsSubtotal + combosSubtotal;

      // Aplicar vale si existe
      let descuentoAplicado = 0;
      let vale = null;
      if (vale_id) {
        vale = await ValeCorporativo.findByPk(vale_id);
        if (!vale) return res.status(404).json({ error: 'Vale no encontrado' });
        if (vale.usado) return res.status(400).json({ error: 'Vale ya fue utilizado' });
        const ahora = new Date();
        if (vale.fecha_expiracion && new Date(vale.fecha_expiracion) < ahora) return res.status(400).json({ error: 'Vale expirado' });

        if (vale.tipo === 'entrada') descuentoAplicado = Math.min(vale.valor || 0, ticketsSubtotal);
        else if (vale.tipo === 'combo') descuentoAplicado = Math.min(vale.valor || 0, combosSubtotal);

        montoTotal = Math.max(0, montoTotal - descuentoAplicado);
      }

      // Crear OrdenTicket
      let ordenTicketPrimero = null;
      for (const item of tickets) {
        const tipoTicket = await TipoTicket.findByPk(item.id_tipo_ticket);
        const ordenTicket = await OrdenTicket.create({
          id_orden_compra: orden.id,
          id_tipo_ticket: item.id_tipo_ticket,
          cantidad: item.cantidad,
          precio_unitario: tipoTicket.precio_base,
          descuento: 0,
        });
        if (!ordenTicketPrimero) ordenTicketPrimero = ordenTicket;
      }

      // Asociar asientos y crear Tickets
      if (orden.id_funcion && asientos.length > 0) {
        if (!ordenTicketPrimero) return res.status(400).json({ error: 'No se pudo encontrar la orden de tickets' });
        for (const { fila, numero } of asientos) {
          const asientoFuncion = await AsientoFuncion.findOne({ where: { id_funcion: orden.id_funcion, fila, numero } });
          if (!asientoFuncion) return res.status(400).json({ error: `El asiento ${fila}${numero} no existe` });

          await asientoFuncion.update({ estado: 'ocupado', id_usuario_bloqueo: req.user.id, bloqueo_expira_en: null });

          const tipoTicketPrincipal = await TipoTicket.findByPk(tickets[0].id_tipo_ticket);
          await Ticket.create({ id_orden_ticket: ordenTicketPrimero.id, id_funcion: orden.id_funcion, id_asiento: asientoFuncion.id, precio: tipoTicketPrincipal.precio_base });
        }
      }

      // Crear OrdenCombo
      let ordenComboPrimero = null;
      for (const item of combos) {
        const combo = await Combo.findByPk(item.id_combo);
        const ordenCombo = await OrdenCombo.create({ id_orden_compra: orden.id, id_combo: item.id_combo, cantidad: item.cantidad, precio_unitario: combo.precio, descuento: 0 });
        if (!ordenComboPrimero) ordenComboPrimero = ordenCombo;
      }

      // Aplicar descuento en registro correspondiente
      if (descuentoAplicado > 0) {
        if (vale.tipo === 'entrada' && ordenTicketPrimero) await ordenTicketPrimero.update({ descuento: descuentoAplicado });
        if (vale.tipo === 'combo' && ordenComboPrimero) await ordenComboPrimero.update({ descuento: descuentoAplicado });
      }

      // Registrar pago
      const pago = await Pago.create({ id_orden_compra: orden.id, id_metodo_pago: metodo_pago || 1, monto_total: montoTotal, estado_pago: 'completado', fecha_pago: new Date() });

      // Actualizar orden
      await orden.update({ estado: 'pagada', monto_total: montoTotal });

      // Marcar vale usado
      if (vale) {
        try { await vale.update({ usado: true, id_orden_compra: orden.id }); } catch (err) { console.error('Error marcando vale como usado:', err); }
      }

      const ordenCompleta = await OrdenCompra.findByPk(orden.id, { include: ordenInclude });

      res.json({ mensaje: '✅ Compra confirmada exitosamente (simulación)', orden: ordenCompleta, pago: { ...pago.toJSON(), nota: 'Este es un pago simulado. No se procesó ningún cargo real.' } });
    } catch (error) {
      console.error('Error confirmarOrden:', error);
      res.status(500).json({ error: 'Error al confirmar orden de compra' });
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
