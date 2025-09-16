const {
  OrdenCompra,
  Usuario,
  Funcion,
  OrdenTicket,
  OrdenCombo,
  Pago,
  TipoUsuario,
  Combo,
} = require("../models");
const { Op } = require("sequelize");

const ordenInclude = [
  { model: Usuario, attributes: ["id", "nombre", "email"] },
  {
    model: Funcion,
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
    attributes: ["id", "cantidad", "precio_unitario", "descuento"],
    include: [{ model: TipoUsuario }],
  },
  {
    model: OrdenCombo,
    attributes: ["id", "cantidad", "precio_unitario", "descuento"],
    include: [{ model: Combo }],
  },
  {
    model: Pago,
    attributes: ["id", "monto_total", "estado_pago", "fecha_pago"],
  },
];

// 📌 Obtener todas las órdenes de compra
exports.listarOrdenes = async (req, res) => {
  try {
    const where = {};

    // Si no es admin, solo mostrar órdenes propias
    if (req.user.rol !== 'admin') {
      where.id_usuario = req.user.id;
    }

    const ordenes = await OrdenCompra.findAll({
      where,
      include: ordenInclude,
    });

    res.json(ordenes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener órdenes de compra" });
  }
};

// 📌 Obtener una orden por ID
exports.obtenerOrden = async (req, res) => {
  try {
    const orden = await OrdenCompra.findByPk(req.params.id, {
      include: ordenInclude,
    });

    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    // Validar propiedad si no es admin
    if (req.user.rol !== 'admin' && orden.id_usuario !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para ver esta orden" });
    }

    res.json(orden);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener orden de compra" });
  }
};

// 📌 Crear nueva orden de compra
exports.crearOrden = async (req, res) => {
  try {
    const { id_funcion, tickets = [], combos = [] } = req.body;

    // Validación condicional
    if (tickets.length > 0 && !id_funcion) {
      return res.status(400).json({
        error: "La función es obligatoria si la orden incluye tickets",
      });
    }

    // Validar existencia de función si se envía
    if (id_funcion) {
      const funcion = await Funcion.findByPk(id_funcion);
      if (!funcion) {
        return res.status(404).json({ error: "Función no encontrada" });
      }

      // Validar que la función no haya comenzado
      const fechaHoraFuncion = new Date(`${funcion.fecha}T${funcion.hora}`);
      if (fechaHoraFuncion <= new Date()) {
        return res.status(400).json({ error: "No se puede crear una orden para una función ya iniciada o pasada" });
      }
    }

    const nueva = await OrdenCompra.create({
      id_usuario: req.user.id,
      id_funcion: id_funcion || null,
    });

    res.status(201).json(nueva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear orden de compra" });
  }
};