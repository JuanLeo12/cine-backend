const { AlquilerSala, Sala, Usuario, Pago } = require("../models");
const { Op } = require("sequelize");
const { validarAlquiler } = require("../utils/validacionesAlquiler");

const alquilerInclude = [
  { model: Sala, as: "sala", attributes: ["id", "nombre"] },
  { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
  { model: Pago, as: "pago", attributes: ["id", "monto_total", "estado_pago"] },
];


// 📌 Listar alquileres
exports.listarAlquileres = async (req, res) => {
  try {
    const where = {};
    if (req.user.rol !== "admin") where.id_usuario = req.user.id;

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
      include: alquilerInclude,
    });

    res.json(alquileres);
  } catch (error) {
    console.error("Error listarAlquileres:", error);
    res.status(500).json({ error: "Error al obtener alquileres de salas" });
  }
};

// 📌 Crear alquiler
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

    const errores = validarAlquiler({
      id_sala,
      fecha,
      hora_inicio,
      hora_fin,
      precio,
    });
    if (errores.length > 0) return res.status(400).json({ errores });

    const sala = await Sala.findByPk(id_sala);
    if (!sala) return res.status(404).json({ error: "Sala no encontrada" });

    // Validar solapamiento de horarios en la misma fecha y sala
    const conflicto = await AlquilerSala.findOne({
      where: {
        id_sala,
        fecha,
        [Op.or]: [
          {
            hora_inicio: { [Op.lt]: hora_fin },
            hora_fin: { [Op.gt]: hora_inicio },
          },
        ],
      },
    });
    if (conflicto) {
      return res
        .status(409)
        .json({ error: "Ya existe un alquiler en ese horario para esta sala" });
    }

    // Validar pago si se envía
    if (id_pago) {
      const pago = await Pago.findByPk(id_pago);
      if (!pago) return res.status(404).json({ error: "Pago no encontrado" });

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

    res
      .status(201)
      .json({ mensaje: "Alquiler registrado correctamente", alquiler: nuevo });
  } catch (error) {
    console.error("Error crearAlquiler:", error);
    res.status(500).json({ error: "Error al registrar alquiler de sala" });
  }
};

// 📌 Obtener alquiler por ID
exports.obtenerAlquiler = async (req, res) => {
  try {
    const alquiler = await AlquilerSala.findByPk(req.params.id, {
      include: alquilerInclude,
    });

    if (!alquiler)
      return res.status(404).json({ error: "Alquiler no encontrado" });

    // Verificar permisos (admin ve todos, corporativo solo los suyos)
    if (req.user.rol !== "admin" && alquiler.id_usuario !== req.user.id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver este alquiler" });
    }

    res.json(alquiler);
  } catch (error) {
    console.error("Error obtenerAlquiler:", error);
    res.status(500).json({ error: "Error al obtener alquiler" });
  }
};

// 📌 Eliminar alquiler
exports.eliminarAlquiler = async (req, res) => {
  try {
    const alquiler = await AlquilerSala.findByPk(req.params.id);

    if (!alquiler)
      return res.status(404).json({ error: "Alquiler no encontrado" });

    if (req.user.rol !== "admin" && alquiler.id_usuario !== req.user.id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar este alquiler" });
    }

    if (alquiler.id_pago) {
      return res
        .status(400)
        .json({ error: "No se puede eliminar un alquiler ya pagado" });
    }

    await alquiler.destroy();
    res.json({ mensaje: "Alquiler de sala eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminarAlquiler:", error);
    res.status(500).json({ error: "Error al eliminar alquiler de sala" });
  }
};
