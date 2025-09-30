const { AsientoFuncion, Funcion, Usuario } = require("../models");
const { validarAsiento } = require("../utils/validacionesAsientos");

const asientoInclude = [
  { model: Funcion, as: "funcion", attributes: ["id", "fecha", "hora"] },
  { model: Usuario, as: "usuarioBloqueo", attributes: ["id", "nombre"] },
];


// 📌 Listar asientos
exports.listarAsientos = async (req, res) => {
  try {
    const where = {};
    if (req.user.rol !== "admin") {
      where.id_usuario_bloqueo = req.user.id;
    }

    const asientos = await AsientoFuncion.findAll({
      where,
      attributes: ["id", "fila", "numero", "estado", "bloqueo_expira_en"],
      include: asientoInclude,
    });

    res.json(asientos);
  } catch (error) {
    console.error("Error listarAsientos:", error);
    res.status(500).json({ error: "Error al obtener asientos reservados" });
  }
};

// 📌 Reservar asiento
exports.reservarAsiento = async (req, res) => {
  try {
    const { id_funcion, fila, numero } = req.body;

    const errores = validarAsiento({ id_funcion, fila, numero });
    if (errores.length > 0) return res.status(400).json({ errores });

    const funcion = await Funcion.findByPk(id_funcion);
    if (!funcion)
      return res.status(404).json({ error: "Función no encontrada" });

    const fechaHoraFuncion = new Date(`${funcion.fecha}T${funcion.hora}`);
    if (fechaHoraFuncion <= new Date()) {
      return res
        .status(400)
        .json({
          error: "No se puede reservar una función ya iniciada o pasada",
        });
    }

    const existente = await AsientoFuncion.findOne({
      where: { id_funcion, fila, numero },
    });

    if (existente) {
      if (
        existente.estado === "bloqueado" &&
        existente.bloqueo_expira_en < new Date()
      ) {
        await existente.destroy(); // liberamos si venció
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
      bloqueo_expira_en: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    });

    res
      .status(201)
      .json({ mensaje: "Asiento bloqueado correctamente", asiento: nuevo });
  } catch (error) {
    console.error("Error reservarAsiento:", error);
    res.status(500).json({ error: "Error al reservar asiento" });
  }
};

// 📌 Eliminar reserva
exports.eliminarAsiento = async (req, res) => {
  try {
    const asiento = await AsientoFuncion.findByPk(req.params.id);

    if (!asiento)
      return res.status(404).json({ error: "Asiento no encontrado" });

    if (
      req.user.rol !== "admin" &&
      asiento.id_usuario_bloqueo !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar esta reserva" });
    }

    if (asiento.estado === "ocupado") {
      return res
        .status(400)
        .json({ error: "No se puede eliminar un asiento ya ocupado" });
    }

    await asiento.destroy();
    res.json({ mensaje: "Reserva de asiento eliminada correctamente" });
  } catch (error) {
    console.error("Error eliminarAsiento:", error);
    res.status(500).json({ error: "Error al eliminar reserva de asiento" });
  }
};
