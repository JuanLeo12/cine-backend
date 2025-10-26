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
const { validarOrdenCompra } = require("../utils/validacionesOrdenCompra");
const { Op } = require("sequelize");

const ordenInclude = [
  { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
  {
    model: Funcion,
    as: "funcion",
    attributes: ["id", "fecha", "hora"],
    include: [
      {
        model: Pelicula,
        as: "pelicula",
        attributes: ["id", "titulo", "duracion"],
      },
      {
        model: Sala,
        as: "sala",
        attributes: ["id", "nombre"],
        include: [
          {
            model: Sede,
            as: "sede",
            attributes: ["id", "nombre", "direccion"],
          },
        ],
      },
    ],
  },
  {
    model: OrdenTicket,
    as: "ordenTickets",
    attributes: ["id", "cantidad", "precio_unitario", "descuento"],
    include: [
      { model: TipoTicket, as: "tipoTicket", attributes: ["id", "nombre"] },
      {
        model: Ticket,
        as: "tickets",
        attributes: ["id", "id_asiento"],
        include: [
          {
            model: AsientoFuncion,
            as: "asientoFuncion",
            attributes: ["id", "fila", "numero"],
          },
        ],
      },
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
    attributes: ["id", "monto_total", "estado_pago", "fecha_pago", "id_metodo_pago"],
    include: [
      {
        model: MetodoPago,
        as: "metodoPago",
        attributes: ["id", "nombre", "estado"],
      },
    ],
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

    console.log('📝 Confirmando orden:', {
      id_orden: id,
      id_usuario: req.user.id,
      tickets,
      asientos,
      metodo_pago
    });

    const orden = await OrdenCompra.findOne({
      where: { 
        id, 
        id_usuario: req.user.id,
        estado: "pendiente" 
      },
      include: [{ model: Funcion, as: "funcion" }],
    });

    if (!orden) {
      console.error('❌ Orden no encontrada:', { id, id_usuario: req.user.id });
      return res.status(404).json({ error: "Orden no encontrada o ya procesada" });
    }

    console.log('✅ Orden encontrada:', { id_orden: orden.id, id_funcion: orden.id_funcion });

    // Verificar que los asientos estén bloqueados por este usuario O extender el bloqueo si expiró
    if (orden.id_funcion && asientos.length > 0) {
      for (const { fila, numero } of asientos) {
        const asiento = await AsientoFuncion.findOne({
          where: { 
            id_funcion: orden.id_funcion, 
            fila, 
            numero
          },
        });

        console.log(`🔍 Verificando asiento ${fila}${numero}:`, {
          encontrado: !!asiento,
          estado: asiento?.estado,
          id_usuario_bloqueo: asiento?.id_usuario_bloqueo,
          bloqueo_expira_en: asiento?.bloqueo_expira_en,
          req_user_id: req.user.id
        });

        // CASO 1: Asiento no existe (nunca fue bloqueado o ya fue limpiado)
        if (!asiento) {
          console.error(`❌ Asiento ${fila}${numero} no existe en la base de datos`);
          return res.status(400).json({ 
            error: `El asiento ${fila}${numero} no está disponible` 
          });
        }

        // CASO 2: Asiento ocupado por otra orden
        if (asiento.estado === "ocupado") {
          console.error(`❌ Asiento ${fila}${numero} ya está ocupado`);
          return res.status(400).json({ 
            error: `El asiento ${fila}${numero} ya fue vendido` 
          });
        }

        // CASO 3: Asiento bloqueado
        if (asiento.estado === "bloqueado") {
          const bloqueadoPorMi = asiento.id_usuario_bloqueo === req.user.id;
          const ahora = new Date();
          const estaExpirado = asiento.bloqueo_expira_en && new Date(asiento.bloqueo_expira_en) < ahora;

          // 3A: Bloqueado por otro usuario
          if (!bloqueadoPorMi) {
            console.error(`❌ Asiento ${fila}${numero} bloqueado por usuario ${asiento.id_usuario_bloqueo}`);
            return res.status(400).json({ 
              error: `El asiento ${fila}${numero} está siendo usado por otro cliente` 
            });
          }

          // 3B: Bloqueado por mí pero expiró - RENOVAR antes de confirmar
          if (bloqueadoPorMi && estaExpirado) {
            console.log(`⚠️ Asiento ${fila}${numero} expiró, renovando antes de confirmar...`);
            await asiento.update({
              bloqueo_expira_en: new Date(Date.now() + 5 * 60 * 1000)
            });
          }

          // 3C: Bloqueado por mí y vigente - OK, continuar
          console.log(`✅ Asiento ${fila}${numero} verificado correctamente`);
        }
      }
    }

    console.log('✅ Todos los asientos verificados');

    // Calcular total
    let montoTotal = 0;

    // Procesar tickets
    for (const item of tickets) {
      const tipoTicket = await TipoTicket.findByPk(item.id_tipo_ticket);
      if (!tipoTicket) {
        console.error(`❌ Tipo de ticket no encontrado: ${item.id_tipo_ticket}`);
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

    // Marcar asientos como OCUPADOS definitivamente y crear tickets
    if (orden.id_funcion && asientos.length > 0) {
      // Obtener el OrdenTicket para asociar los tickets
      const ordenTicket = await OrdenTicket.findOne({ 
        where: { id_orden_compra: orden.id },
        order: [['id', 'ASC']]
      });
      
      if (!ordenTicket) {
        return res.status(400).json({ error: "No se pudo encontrar la orden de tickets" });
      }

      for (const { fila, numero } of asientos) {
        // Buscar el asiento primero
        const asientoFuncion = await AsientoFuncion.findOne({
          where: { id_funcion: orden.id_funcion, fila, numero }
        });

        if (!asientoFuncion) {
          return res.status(400).json({ 
            error: `El asiento ${fila}${numero} no existe` 
          });
        }

        // Marcar como ocupado
        await asientoFuncion.update({ 
          estado: "ocupado",
          id_usuario_bloqueo: req.user.id,
          bloqueo_expira_en: null // Ya no expira
        });

        // Crear ticket usando el ID correcto del asiento_funcion
        // El modelo Ticket usa "id_asiento" que referencia a asientos_funcion.id
        const tipoTicketPrincipal = await TipoTicket.findOne({ 
          where: { id: tickets[0].id_tipo_ticket } 
        });
        
        await Ticket.create({
          id_orden_ticket: ordenTicket.id,
          id_funcion: orden.id_funcion,
          id_asiento: asientoFuncion.id, // ← CORRECCIÓN: usar id_asiento, no id_asiento_funcion
          precio: tipoTicketPrincipal.precio_base,
        });
        
        console.log(`🎫 Ticket creado para asiento ${fila}${numero} (id: ${asientoFuncion.id})`);
      }
    }

    // Registrar pago simulado
    const pago = await Pago.create({
      id_orden_compra: orden.id,
      id_metodo_pago: metodo_pago || 1,
      monto_total: montoTotal,
      estado_pago: "completado", // ✅ CORRECCIÓN: usar "completado" (valor válido según modelo)
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
