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
  TarifaSala,
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
        attributes: ["id", "nombre", "tipo_sala"],
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
    console.log(`🔍 Usuario ${req.user.id} (${req.user.rol}) solicitando órdenes. Filtro:`, where);
    
    const ordenes = await OrdenCompra.findAll({ 
      where, 
      include: ordenInclude, 
      order: [['fecha_compra', 'DESC']] 
    });
    
    console.log(`📦 Encontradas ${ordenes.length} órdenes para usuario ${req.user.id}`);
    console.log('📋 IDs de órdenes:', ordenes.map(o => ({ id: o.id, id_usuario: o.id_usuario })));
    
    res.json(ordenes);
  } catch (error) {
    console.error('❌ Error listarOrdenes:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Error al listar órdenes', details: error.message });
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

      // Obtener tipo de sala de la función (si existe)
      let tipoSala = '2D'; // Default
      if (orden.id_funcion) {
        const funcion = await Funcion.findByPk(orden.id_funcion, {
          include: [{ model: Sala, as: 'sala', attributes: ['tipo_sala'] }]
        });
        if (funcion && funcion.sala) {
          tipoSala = funcion.sala.tipo_sala;
          console.log('🎬 Tipo de sala de la función:', tipoSala);
        }
      }

      // Solo procesar tickets si hay alguno
      if (tickets && tickets.length > 0) {
        for (const item of tickets) {
          const tipoTicket = await TipoTicket.findByPk(item.id_tipo_ticket);
          if (!tipoTicket) return res.status(404).json({ error: `Tipo de ticket ${item.id_tipo_ticket} no encontrado` });
          
          // Buscar precio según tipo de sala
          const tarifa = await TarifaSala.findOne({
            where: { id_tipo_ticket: item.id_tipo_ticket, tipo_sala: tipoSala }
          });
          
          const precioUnitario = tarifa ? parseFloat(tarifa.precio) : parseFloat(tipoTicket.precio_base);
          console.log(`💰 Precio para ${tipoTicket.nombre} en sala ${tipoSala}: S/ ${precioUnitario}`);
          
          ticketsSubtotal += precioUnitario * item.cantidad;
        }
      }

      // Solo procesar combos si hay alguno
      if (combos && combos.length > 0) {
        for (const item of combos) {
          const combo = await Combo.findByPk(item.id_combo);
          if (!combo) return res.status(404).json({ error: `Combo ${item.id_combo} no encontrado` });
          combosSubtotal += combo.precio * item.cantidad;
        }
      }

      let montoTotal = ticketsSubtotal + combosSubtotal;

      // Aplicar vale si existe
      let descuentoAplicado = 0;
      let vale = null;
      if (vale_id) {
        vale = await ValeCorporativo.findByPk(vale_id);
        if (!vale) return res.status(404).json({ error: 'Vale no encontrado' });
        
        // Verificar que tenga usos disponibles
        if (vale.usos_disponibles <= 0) {
          return res.status(400).json({ error: 'Vale sin usos disponibles (ya fue utilizado completamente)' });
        }
        
        const ahora = new Date();
        if (vale.fecha_expiracion && new Date(vale.fecha_expiracion) < ahora) return res.status(400).json({ error: 'Vale expirado' });

        // El campo "valor" representa el PORCENTAJE de descuento (ej: 20 = 20%)
        const porcentajeDescuento = (vale.valor || 0) / 100;
        
        if (vale.tipo === 'entrada') {
          // Aplicar porcentaje de descuento sobre tickets
          descuentoAplicado = ticketsSubtotal * porcentajeDescuento;
        } else if (vale.tipo === 'combo') {
          // Aplicar porcentaje de descuento sobre combos
          descuentoAplicado = combosSubtotal * porcentajeDescuento;
        }

        montoTotal = Math.max(0, montoTotal - descuentoAplicado);
        
        console.log(`💰 Vale aplicado: ${vale.valor}% de descuento = S/ ${descuentoAplicado.toFixed(2)}`);
      }

      // Crear OrdenTicket (solo si hay tickets)
      let ordenTicketPrimero = null;
      if (tickets && tickets.length > 0) {
        for (const item of tickets) {
          const tipoTicket = await TipoTicket.findByPk(item.id_tipo_ticket);
          
          // Buscar precio según tipo de sala
          const tarifa = await TarifaSala.findOne({
            where: { id_tipo_ticket: item.id_tipo_ticket, tipo_sala: tipoSala }
          });
          
          const precioUnitario = tarifa ? parseFloat(tarifa.precio) : parseFloat(tipoTicket.precio_base);
          
          const ordenTicket = await OrdenTicket.create({
            id_orden_compra: orden.id,
            id_tipo_ticket: item.id_tipo_ticket,
            cantidad: item.cantidad,
            precio_unitario: precioUnitario,
            descuento: 0,
          });
          if (!ordenTicketPrimero) ordenTicketPrimero = ordenTicket;
        }
      }

      // Asociar asientos y crear Tickets
      if (orden.id_funcion && asientos.length > 0) {
        if (!ordenTicketPrimero) return res.status(400).json({ error: 'No se pudo encontrar la orden de tickets' });
        
        for (const { fila, numero } of asientos) {
          const asientoFuncion = await AsientoFuncion.findOne({ where: { id_funcion: orden.id_funcion, fila, numero } });
          if (!asientoFuncion) return res.status(400).json({ error: `El asiento ${fila}${numero} no existe` });

          await asientoFuncion.update({ estado: 'ocupado', id_usuario_bloqueo: req.user.id, bloqueo_expira_en: null });

          // Usar el precio del primer tipo de ticket con tarifa de sala
          const tipoTicketPrincipal = await TipoTicket.findByPk(tickets[0].id_tipo_ticket);
          const tarifaPrincipal = await TarifaSala.findOne({
            where: { id_tipo_ticket: tickets[0].id_tipo_ticket, tipo_sala: tipoSala }
          });
          const precioPrincipal = tarifaPrincipal ? parseFloat(tarifaPrincipal.precio) : parseFloat(tipoTicketPrincipal.precio_base);
          
          await Ticket.create({ 
            id_orden_ticket: ordenTicketPrimero.id, 
            id_funcion: orden.id_funcion, 
            id_asiento: asientoFuncion.id, 
            precio: precioPrincipal 
          });
        }
      }

      // Crear OrdenCombo (solo si hay combos)
      let ordenComboPrimero = null;
      if (combos && combos.length > 0) {
        for (const item of combos) {
          const combo = await Combo.findByPk(item.id_combo);
          const ordenCombo = await OrdenCombo.create({ 
            id_orden_compra: orden.id, 
            id_combo: item.id_combo, 
            cantidad: item.cantidad, 
            precio_unitario: combo.precio, 
            descuento: 0 
          });
          if (!ordenComboPrimero) ordenComboPrimero = ordenCombo;
        }
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

      // Decrementar usos disponibles del vale
      if (vale) {
        try {
          const nuevosUsos = vale.usos_disponibles - 1;
          const yaUsado = nuevosUsos <= 0;
          
          await vale.update({ 
            usos_disponibles: nuevosUsos,
            usado: yaUsado // Marcar como usado solo cuando no quedan usos
          });
          
          console.log(`✅ Vale ${vale.codigo}: ${nuevosUsos} usos restantes ${yaUsado ? '(AGOTADO)' : ''}`);
        } catch (err) { 
          console.error('Error actualizando usos del vale:', err); 
        }
      }

      const ordenCompleta = await OrdenCompra.findByPk(orden.id, { include: ordenInclude });

      res.json({ 
        mensaje: '✅ Compra confirmada exitosamente (simulación)', 
        orden: ordenCompleta, 
        pago: ordenCompleta.pago // Usar el pago de ordenCompleta que incluye metodoPago
      });
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
