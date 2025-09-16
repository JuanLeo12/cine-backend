const { AlquilerSala, Sala, Usuario, Pago } = require("../models");
const { Op } = require("sequelize");

// 📌 Obtener todos los alquileres de salas
exports.listarAlquileres = async (req, res) => {
  try {
    const where = {};

    // Si no es admin, solo ve sus propios alquileres
    if (req.user.rol !== "admin") {
      where.id_usuario = req.user.id;
    }

    const alquileres = await AlquilerSala.findAll({
      where,
      attributes: [
        "id",
        "fecha",
        "hora_inicio",
        "hora_fin",
        "descripcion_evento",
        "precio",
      ],
      include: [
        { model: Sala, attributes: ["id", "nombre"] },
        { model: Usuario, attributes: ["id", "nombre", "email"] },
        { model: Pago, attributes: ["id", "monto_total", "estado_pago"] },
      ],
    });

    res.json(alquileres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener alquileres de salas" });
  }
};

// 📌 Crear nuevo alquiler de sala
exports.crearAlquiler = async (req, res) => {
  try {
    const {
      id_sala,
      fecha,
      hora_inicio,
      hora_fin,
      descripcion_evento,
      precio,
      id_pago,
    } = req.body;

    // Validaciones básicas
    if (
      !id_sala ||
      !fecha ||
      !hora_inicio ||
      !hora_fin ||
      !descripcion_evento ||
      precio == null
    ) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    if (precio <= 0) {
      return res
        .status(400)
        .json({ error: "El precio debe ser mayor que cero" });
    }

    if (hora_fin <= hora_inicio) {
      return res.status(400).json({
        error: "La hora de fin debe ser posterior a la hora de inicio",
      });
    }

    // Validar existencia de sala
    const sala = await Sala.findByPk(id_sala);
    if (!sala) {
      return res.status(404).json({ error: "Sala no encontrada" });
    }

    // Validar solapamiento
    const conflicto = await AlquilerSala.findOne({
      where: {
        id_sala,
        fecha,
        [Op.or]: [
          { hora_inicio: { [Op.between]: [hora_inicio, hora_fin] } },
          { hora_fin: { [Op.between]: [hora_inicio, hora_fin] } },
        ],
      },
    });
    if (conflicto) {
      return res
        .status(409)
        .json({ error: "Ya existe un alquiler para esta sala en ese horario" });
    }

    // Validar pago si se envía
    if (id_pago) {
      const pago = await Pago.findByPk(id_pago);
      if (!pago) {
        return res.status(404).json({ error: "Pago no encontrado" });
      }
      // Si no es admin, el pago debe ser suyo
      if (req.user.rol !== "admin" && pago.id_usuario !== req.user.id) {
        return res
          .status(403)
          .json({ error: "No puedes asociar un pago que no es tuyo" });
      }
    }

    const nuevo = await AlquilerSala.create({
      id_sala,
      id_usuario: req.user.id,
      fecha,
      hora_inicio,
      hora_fin,
      descripcion_evento,
      precio,
      id_pago: id_pago || null,
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar alquiler de sala" });
  }
};

// 📌 Eliminar alquiler de sala
exports.eliminarAlquiler = async (req, res) => {
  try {
    const alquiler = await AlquilerSala.findByPk(req.params.id);

    if (!alquiler) {
      return res.status(404).json({ error: "Alquiler no encontrado" });
    }

    // Validar propiedad o rol
    if (req.user.rol !== "admin" && alquiler.id_usuario !== req.user.id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar este alquiler" });
    }

    // Evitar eliminar si ya está pagado
    if (alquiler.id_pago) {
      return res
        .status(400)
        .json({ error: "No se puede eliminar un alquiler ya pagado" });
    }

    await alquiler.destroy();
    res.json({ mensaje: "Alquiler de sala eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar alquiler de sala" });
  }
};
