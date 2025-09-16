const { AsientoFuncion, Funcion, Usuario } = require("../models");
const { Op } = require("sequelize");

// 📌 Obtener todos los asientos reservados
exports.listarAsientos = async (req, res) => {
  try {
    const where = {};

    // Si no es admin, solo mostrar asientos bloqueados por el usuario
    if (req.user.rol !== "admin") {
      where.id_usuario_bloqueo = req.user.id;
    }

    const asientos = await AsientoFuncion.findAll({
      where,
      attributes: ["id", "fila", "numero", "estado", "bloqueo_expira_en"],
      include: [
        { model: Funcion, attributes: ["id", "fecha", "hora"] },
        { model: Usuario, as: "usuarioBloqueo", attributes: ["id", "nombre"] },
      ],
    });

    res.json(asientos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener asientos reservados" });
  }
};

// 📌 Reservar (bloquear) un asiento
exports.reservarAsiento = async (req, res) => {
  try {
    const { id_funcion, fila, numero } = req.body;

    if (!id_funcion || !fila || !numero) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    if (fila <= 0 || numero <= 0) {
      return res
        .status(400)
        .json({ error: "Fila y número deben ser positivos" });
    }

    // Validar existencia de función
    const funcion = await Funcion.findByPk(id_funcion);
    if (!funcion) {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    // Validar que la función no haya comenzado
    const fechaHoraFuncion = new Date(`${funcion.fecha}T${funcion.hora}`);
    if (fechaHoraFuncion <= new Date()) {
      return res
        .status(400)
        .json({
          error: "No se puede reservar para una función ya iniciada o pasada",
        });
    }

    // Verificar si el asiento ya está reservado o bloqueado
    const existente = await AsientoFuncion.findOne({
      where: { id_funcion, fila, numero },
    });

    if (existente) {
      // Si el bloqueo expiró, se puede reutilizar
      if (
        existente.estado === "bloqueado" &&
        existente.bloqueo_expira_en < new Date()
      ) {
        await existente.destroy();
      } else {
        return res
          .status(409)
          .json({ error: "El asiento ya está reservado o bloqueado" });
      }
    }

    const nuevo = await AsientoFuncion.create({
      id_funcion,
      fila,
      numero,
      estado: "bloqueado",
      id_usuario_bloqueo: req.user.id,
      bloqueo_expira_en: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al reservar asiento" });
  }
};

// 📌 Eliminar reserva de asiento
exports.eliminarAsiento = async (req, res) => {
  try {
    const asiento = await AsientoFuncion.findByPk(req.params.id);

    if (!asiento) {
      return res.status(404).json({ error: "Asiento no encontrado" });
    }

    // Solo el usuario que lo bloqueó o un admin puede eliminarlo
    if (
      req.user.rol !== "admin" &&
      asiento.id_usuario_bloqueo !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar esta reserva" });
    }

    // Si el asiento ya está reservado (confirmado), no permitir eliminar
    if (asiento.estado === "reservado") {
      return res
        .status(400)
        .json({ error: "No se puede eliminar un asiento ya reservado" });
    }

    await asiento.destroy();
    res.json({ mensaje: "Reserva de asiento eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar reserva de asiento" });
  }
};
