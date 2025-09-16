const { Publicidad, Usuario, Sede, Pago } = require("../models");
const { Op } = require("sequelize");

// 📌 Obtener todas las campañas publicitarias
exports.listarPublicidad = async (req, res) => {
  try {
    const where = {};

    // Si no es admin, solo mostrar campañas propias
    if (req.user.rol !== "admin") {
      where.id_usuario = req.user.id;
    }

    const campañas = await Publicidad.findAll({
      where,
      include: [
        { model: Usuario, attributes: ["id", "nombre", "email"] },
        { model: Sede, attributes: ["id", "nombre", "ciudad"] },
        {
          model: Pago,
          attributes: ["id", "monto_total", "estado_pago", "fecha_pago"],
        },
      ],
    });
    res.json(campañas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener campañas publicitarias" });
  }
};

// 📌 Crear nueva campaña publicitaria
exports.crearPublicidad = async (req, res) => {
  try {
    // Solo corporativo o admin
    if (!["corporativo", "admin"].includes(req.user.rol)) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para crear campañas publicitarias" });
    }

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

    if (!tipo || !fecha_inicio || !fecha_fin || !precio || !id_sede) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    if (precio <= 0) {
      return res
        .status(400)
        .json({ error: "El precio debe ser mayor que cero" });
    }

    if (new Date(fecha_fin) < new Date(fecha_inicio)) {
      return res
        .status(400)
        .json({
          error: "La fecha de fin no puede ser anterior a la de inicio",
        });
    }

    // Validar sede
    const sede = await Sede.findByPk(id_sede);
    if (!sede) {
      return res.status(404).json({ error: "Sede no encontrada" });
    }

    // Validar pago si se envía
    if (id_pago) {
      const pago = await Pago.findByPk(id_pago);
      if (!pago) {
        return res.status(404).json({ error: "Pago no encontrado" });
      }
      if (req.user.rol !== "admin" && pago.id_usuario !== req.user.id) {
        return res
          .status(403)
          .json({ error: "No puedes asociar un pago que no es tuyo" });
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
      id_pago,
    });

    res.status(201).json(nueva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar campaña publicitaria" });
  }
};

// 📌 Eliminar campaña publicitaria
exports.eliminarPublicidad = async (req, res) => {
  try {
    const publicidad = await Publicidad.findByPk(req.params.id);
    if (!publicidad) {
      return res.status(404).json({ error: "Campaña no encontrada" });
    }

    // Validar propiedad o rol admin
    if (req.user.rol !== "admin" && publicidad.id_usuario !== req.user.id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar esta campaña" });
    }

    if (["aprobada", "activa"].includes(publicidad.estado)) {
      return res
        .status(403)
        .json({
          error: "No se puede eliminar una campaña ya aprobada o activa",
        });
    }

    await publicidad.destroy();
    res.json({ mensaje: "Campaña publicitaria eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar campaña publicitaria" });
  }
};

// 📌 Aprobar campaña publicitaria (solo admin)
exports.aprobarPublicidad = async (req, res) => {
  try {
    if (req.user.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para aprobar campañas" });
    }

    const { id } = req.params;
    const publicidad = await Publicidad.findByPk(id);
    if (!publicidad) {
      return res.status(404).json({ error: "Campaña no encontrada" });
    }

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
    console.error(error);
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
        { model: Usuario, attributes: ["id", "nombre"] },
        { model: Sede, attributes: ["id", "nombre"] },
      ],
    });

    res.json(activas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener campañas activas" });
  }
};

// 📌 Listar campañas pendientes de aprobación (solo admin)
exports.listarPublicidadPendiente = async (req, res) => {
  try {
    if (req.user.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver campañas pendientes" });
    }

    const pendientes = await Publicidad.findAll({
      where: { estado: "pendiente" },
      include: [
        { model: Usuario, attributes: ["id", "nombre", "email"] },
        { model: Sede, attributes: ["id", "nombre"] },
      ],
    });

    res.json(pendientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener campañas pendientes" });
  }
};
