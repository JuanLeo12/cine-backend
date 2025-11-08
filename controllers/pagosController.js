const {
  Pago,
  OrdenCompra,
  MetodoPago,
  Usuario,
  Funcion,
} = require("../models");
const { validarPago } = require("../utils/validacionesPago");
const { Op } = require("sequelize");

const pagoInclude = [
  {
    model: OrdenCompra,
    as: "ordenCompra",
    include: [
      { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
      {
        model: Funcion,
        as: "funcion",
        attributes: ["id", "fecha", "hora", "es_privada", "id_cliente_corporativo"],
      },
    ],
  },
  {
    model: MetodoPago,
    as: "metodoPago",
    attributes: ["id", "nombre"],
  },
];

// 📌 Listar pagos
exports.listarPagos = async (req, res) => {
  try {
    const where = {};
    if (req.user.rol !== "admin") {
      where["$ordenCompra.id_usuario$"] = req.user.id;
    }

    const pagos = await Pago.findAll({
      where,
      include: pagoInclude,
      order: [["fecha_pago", "DESC"]],
    });

    res.json(pagos);
  } catch (error) {
    console.error("Error listarPagos:", error);
    res.status(500).json({ error: "Error al obtener pagos" });
  }
};

// 📌 Obtener pago por ID
exports.obtenerPago = async (req, res) => {
  try {
    const pago = await Pago.findByPk(req.params.id, { include: pagoInclude });
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });

    const esPropietarioOrden =
      pago.ordenCompra && pago.ordenCompra.id_usuario === req.user.id;
    const esPropietarioFuncion =
      pago.funcion && pago.funcion.id_cliente_corporativo === req.user.id;

    if (
      req.user.rol !== "admin" &&
      !esPropietarioOrden &&
      !esPropietarioFuncion
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver este pago" });
    }

    res.json(pago);
  } catch (error) {
    console.error("Error obtenerPago:", error);
    res.status(500).json({ error: "Error al obtener pago" });
  }
};

// 📌 Registrar pago
exports.crearPago = async (req, res) => {
  try {
    const {
      id_orden_compra,
      id_funcion,
      id_metodo_pago,
      monto_total,
      estado_pago = "completado",
    } = req.body;

    console.log('💰 Datos recibidos para crear pago:', {
      id_orden_compra,
      id_funcion,
      id_metodo_pago,
      monto_total,
      estado_pago,
      user: req.user?.id
    });

    const errores = validarPago({
      id_orden_compra,
      id_funcion,
      id_metodo_pago,
      monto_total,
      estado_pago,
    });
    
    // Permitir pagos sin orden si es usuario corporativo/cliente (para vales)
    const esPagoCorporativoSinOrden = (req.user?.rol === 'corporativo' || req.user?.rol === 'cliente') 
                                       && !id_orden_compra 
                                       && !id_funcion;
    
    if (errores.length > 0 && !esPagoCorporativoSinOrden) {
      console.log('❌ Errores de validación:', errores);
      return res.status(400).json({ errores });
    }

    // Validar método de pago
    const metodo = await MetodoPago.findByPk(id_metodo_pago);
    if (!metodo) {
      console.log('❌ Método de pago no encontrado:', id_metodo_pago);
      return res.status(404).json({ error: "Método de pago no encontrado" });
    }

    // Validar OrdenCompra (solo si se proporciona)
    if (id_orden_compra) {
      const orden = await OrdenCompra.findByPk(id_orden_compra);
      if (!orden)
        return res.status(404).json({ error: "Orden de compra no encontrada" });
      if (req.user.rol !== "admin" && orden.id_usuario !== req.user.id) {
        return res
          .status(403)
          .json({ error: "No puedes pagar una orden que no es tuya" });
      }
    }

    // Validar Funcion (corporativo) - solo si se proporciona
    if (id_funcion) {
      const funcion = await Funcion.findByPk(id_funcion);
      if (!funcion)
        return res.status(404).json({ error: "Función no encontrada" });
      if (
        req.user.rol !== "admin" &&
        funcion.id_cliente_corporativo !== req.user.id
      ) {
        return res
          .status(403)
          .json({ error: "No puedes pagar una función que no es tuya" });
      }
    }

    const nuevo = await Pago.create({
      id_orden_compra: id_orden_compra || null,
      id_funcion: id_funcion || null,
      id_metodo_pago,
      monto_total,
      estado_pago,
      fecha_pago: new Date(),
    });

    console.log('✅ Pago creado exitosamente:', nuevo.id);
    res.status(201).json({ mensaje: "Pago registrado con éxito", pago: nuevo, id: nuevo.id });
  } catch (error) {
    console.error("Error crearPago:", error);
    res.status(500).json({ error: "Error al registrar pago" });
  }
};
