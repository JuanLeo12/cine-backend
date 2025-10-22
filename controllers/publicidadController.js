const { Publicidad, Usuario, Sede, Pago, OrdenCompra } = require("../models");
const { validarPublicidad } = require("../utils/validacionesPublicidad");
const { Op } = require("sequelize");

const publicidadInclude = [
  { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
  { model: Sede, as: "sede", attributes: ["id", "nombre", "ciudad"] },
  {
    model: Pago,
    as: "pago",
    attributes: ["id", "monto_total", "estado_pago", "fecha_pago"],
    include: [
      {
        model: OrdenCompra,
        as: "ordenCompra",
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id", "nombre", "email"],
          },
        ],
      },
    ],
  },
];

// 📌 Listar campañas (admin ve todas, corporativo solo propias)
exports.listarPublicidad = async (req, res) => {
  try {
    const where = {};
    if (req.user.rol !== "admin") where.id_usuario = req.user.id;

    const campañas = await Publicidad.findAll({
      where,
      include: publicidadInclude,
      order: [["fecha_inicio", "DESC"]],
    });

    res.json(campañas);
  } catch (error) {
    console.error("Error listarPublicidad:", error);
    res.status(500).json({ error: "Error al obtener campañas publicitarias" });
  }
};

// 📌 Crear campaña
exports.crearPublicidad = async (req, res) => {
  try {
    const {
      cliente,
      tipo,
      fecha_inicio,
      fecha_fin,
      precio,
      descripcion,
      imagen_url,
      id_sede,
      id_pago,
      visible,
    } = req.body;

    const errores = validarPublicidad({
      tipo,
      fecha_inicio,
      fecha_fin,
      precio,
      id_sede,
    });
    if (errores.length > 0) return res.status(400).json({ errores });

    // Validar sede
    const sede = await Sede.findByPk(id_sede);
    if (!sede) return res.status(404).json({ error: "Sede no encontrada" });

    // Validar pago si se envía
    if (id_pago) {
      const pago = await Pago.findByPk(id_pago, {
        include: [
          {
            model: OrdenCompra,
            as: "ordenCompra",
            include: [{ model: Usuario, as: "usuario", attributes: ["id"] }],
          },
        ],
      });

      if (!pago) return res.status(404).json({ error: "Pago no encontrado" });

      if (req.user.rol !== "admin") {
        const esPropietario =
          pago.ordenCompra && pago.ordenCompra.usuario.id === req.user.id;

        if (!esPropietario) {
          return res
            .status(403)
            .json({ error: "No puedes asociar un pago que no es tuyo" });
        }
      }
    }

    const nueva = await Publicidad.create({
      cliente: cliente || null,
      tipo,
      fecha_inicio,
      fecha_fin,
      precio,
      descripcion,
      imagen_url,
      visible: visible ?? true,
      id_usuario: req.user.id,
      id_sede,
      id_pago: id_pago || null,
    });

    res
      .status(201)
      .json({ mensaje: "Campaña registrada con éxito", publicidad: nueva });
  } catch (error) {
    console.error("Error crearPublicidad:", error);
    res.status(500).json({ error: "Error al registrar campaña publicitaria" });
  }
};

// 📌 Obtener campaña por ID
exports.obtenerPublicidad = async (req, res) => {
  try {
    const publicidad = await Publicidad.findByPk(req.params.id, {
      include: publicidadInclude,
    });

    if (!publicidad)
      return res.status(404).json({ error: "Campaña no encontrada" });

    // Verificar permisos (admin ve todas, corporativo solo las suyas)
    if (req.user.rol !== "admin" && publicidad.id_usuario !== req.user.id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver esta campaña" });
    }

    res.json(publicidad);
  } catch (error) {
    console.error("Error obtenerPublicidad:", error);
    res.status(500).json({ error: "Error al obtener campaña" });
  }
};

// 📌 Eliminar campaña
exports.eliminarPublicidad = async (req, res) => {
  try {
    const publicidad = await Publicidad.findByPk(req.params.id);

    if (!publicidad)
      return res.status(404).json({ error: "Campaña no encontrada" });

    if (req.user.rol !== "admin" && publicidad.id_usuario !== req.user.id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar esta campaña" });
    }

    if (["aprobada", "activa"].includes(publicidad.estado)) {
      return res
        .status(400)
        .json({ error: "No se puede eliminar una campaña aprobada o activa" });
    }

    await publicidad.destroy();
    res.json({ mensaje: "Campaña eliminada correctamente" });
  } catch (error) {
    console.error("Error eliminarPublicidad:", error);
    res.status(500).json({ error: "Error al eliminar campaña publicitaria" });
  }
};

// 📌 Aprobar campaña (solo admin)
exports.aprobarPublicidad = async (req, res) => {
  try {
    const publicidad = await Publicidad.findByPk(req.params.id);
    if (!publicidad)
      return res.status(404).json({ error: "Campaña no encontrada" });

    if (publicidad.estado !== "pendiente") {
      return res
        .status(400)
        .json({ error: "Solo se pueden aprobar campañas pendientes" });
    }

    publicidad.estado = "aprobada";
    publicidad.id_admin_aprobador = req.user.id;
    publicidad.fecha_aprobacion = new Date();

    await publicidad.save();
    res.json({ mensaje: "Campaña aprobada correctamente", publicidad });
  } catch (error) {
    console.error("Error aprobarPublicidad:", error);
    res.status(500).json({ error: "Error al aprobar campaña publicitaria" });
  }
};

// 📌 Listar campañas activas y visibles (público)
exports.listarPublicidadActiva = async (req, res) => {
  try {
    const hoy = new Date();

    const activas = await Publicidad.findAll({
      where: {
        estado: "activa",
        visible: true,
        fecha_inicio: { [Op.lte]: hoy },
        fecha_fin: { [Op.gte]: hoy },
      },
      include: [
        { model: Usuario, as: "usuario", attributes: ["id", "nombre"] },
        { model: Sede, as: "sede", attributes: ["id", "nombre"] },
      ],
    });

    res.json(activas);
  } catch (error) {
    console.error("Error listarPublicidadActiva:", error);
    res.status(500).json({ error: "Error al obtener campañas activas" });
  }
};

// 📌 Listar campañas pendientes (solo admin)
exports.listarPublicidadPendiente = async (req, res) => {
  try {
    const pendientes = await Publicidad.findAll({
      where: { estado: "pendiente" },
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "nombre", "email"],
        },
        { model: Sede, as: "sede", attributes: ["id", "nombre"] },
      ],
    });

    res.json(pendientes);
  } catch (error) {
    console.error("Error listarPublicidadPendiente:", error);
    res.status(500).json({ error: "Error al obtener campañas pendientes" });
  }
};
