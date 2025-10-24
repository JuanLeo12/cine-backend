const { AsientoFuncion, Funcion, Usuario } = require("../models");
const { validarAsiento } = require("../utils/validacionesAsientos");

const asientoInclude = [
  { model: Funcion, as: "funcion", attributes: ["id", "fecha", "hora"] },
  { model: Usuario, as: "usuarioBloqueo", attributes: ["id", "nombre"] },
];

// 📌 Listar asientos de una función (público)
exports.listarAsientosPorFuncion = async (req, res) => {
  try {
    const { id_funcion } = req.params;

    const funcion = await Funcion.findByPk(id_funcion);
    if (!funcion) {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    const asientos = await AsientoFuncion.findAll({
      where: { id_funcion },
      attributes: ["id", "fila", "numero", "estado", "bloqueo_expira_en", "id_usuario_bloqueo"],
      order: [["fila", "ASC"], ["numero", "ASC"]],
    });

    res.json(asientos);
  } catch (error) {
    console.error("Error listarAsientosPorFuncion:", error);
    res.status(500).json({ error: "Error al obtener asientos de la función" });
  }
};

// 📌 Bloquear asiento
exports.bloquearAsiento = async (req, res) => {
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
          error: "No se puede bloquear asiento de una función ya iniciada",
        });
    }

    // Verificar si el asiento ya existe
    const existente = await AsientoFuncion.findOne({
      where: { id_funcion, fila, numero },
    });

    if (existente) {
      // Si está bloqueado y el bloqueo ha expirado, lo liberamos
      if (
        existente.estado === "bloqueado" &&
        existente.bloqueo_expira_en &&
        new Date(existente.bloqueo_expira_en) < new Date()
      ) {
        await existente.destroy();
      } else if (existente.estado === "ocupado") {
        // Asiento ocupado definitivamente
        return res.status(409).json({ error: "El asiento ya está ocupado" });
      } else if (existente.estado === "bloqueado") {
        // Asiento bloqueado por otro usuario
        if (existente.id_usuario_bloqueo === req.user.id) {
          // El mismo usuario está re-bloqueando (extender tiempo)
          await existente.update({
            bloqueo_expira_en: new Date(Date.now() + 5 * 60 * 1000),
          });
          return res.json({ 
            mensaje: "Bloqueo extendido", 
            asiento: existente 
          });
        }
        return res
          .status(409)
          .json({ error: "El asiento está bloqueado por otro usuario" });
      }
    }

    // Crear nuevo bloqueo temporal (5 minutos)
    const nuevo = await AsientoFuncion.create({
      id_funcion,
      fila,
      numero,
      estado: "bloqueado",
      id_usuario_bloqueo: req.user.id,
      bloqueo_expira_en: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    });

    res.json({ 
      mensaje: "Asiento bloqueado correctamente (5 minutos)", 
      asiento: nuevo 
    });
  } catch (error) {
    console.error("Error bloquearAsiento:", error);
    res.status(500).json({ error: "Error al bloquear asiento" });
  }
};

// 📌 Liberar asiento
exports.liberarAsiento = async (req, res) => {
  try {
    const { id_funcion, fila, numero } = req.body;

    const asiento = await AsientoFuncion.findOne({
      where: { id_funcion, fila, numero },
    });

    if (!asiento)
      return res.status(404).json({ error: "Asiento no encontrado" });

    if (
      req.user.rol !== "admin" &&
      asiento.id_usuario_bloqueo !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para liberar este asiento" });
    }

    if (asiento.estado === "ocupado") {
      return res
        .status(400)
        .json({ error: "No se puede liberar un asiento ya ocupado" });
    }

    await asiento.destroy();
    res.json({ mensaje: "Asiento liberado correctamente" });
  } catch (error) {
    console.error("Error liberarAsiento:", error);
    res.status(500).json({ error: "Error al liberar asiento" });
  }
};
