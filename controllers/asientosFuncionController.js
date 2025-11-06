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

    // Limpiar asientos bloqueados que ya expiraron
    const ahora = new Date();
    const asientosFiltrados = [];
    
    for (const asiento of asientos) {
      if (asiento.estado === "bloqueado" && asiento.bloqueo_expira_en) {
        if (new Date(asiento.bloqueo_expira_en) < ahora) {
          // Bloqueo expirado - eliminar el registro
          await asiento.destroy();
          console.log(`🧹 Asiento ${asiento.fila}${asiento.numero} - Bloqueo expirado, limpiado`);
          continue; // No incluir en respuesta
        }
      }
      asientosFiltrados.push(asiento);
    }

    res.json(asientosFiltrados);
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
    let existente = await AsientoFuncion.findOne({
      where: { id_funcion, fila, numero },
    });

    if (existente) {
      // CASO 1: Asiento ocupado definitivamente
      if (existente.estado === "ocupado") {
        return res.status(409).json({ error: "El asiento ya está ocupado" });
      }

      // CASO 2: Asiento bloqueado
      if (existente.estado === "bloqueado") {
        const ahora = new Date();
        const bloqueadoPorMi = existente.id_usuario_bloqueo === req.user.id;
        const estaExpirado = existente.bloqueo_expira_en && new Date(existente.bloqueo_expira_en) < ahora;
        const sinUsuario = !existente.id_usuario_bloqueo;

        // 2A: Bloqueado sin usuario (huérfano) - tomar posesión
        if (sinUsuario) {
          console.log(`🔄 Tomando posesión de asiento huérfano: ${fila}${numero} - Usuario ${req.user.id}`);
          await existente.update({
            id_usuario_bloqueo: req.user.id,
            bloqueo_expira_en: new Date(Date.now() + 5 * 60 * 1000),
          });
          return res.json({ 
            mensaje: "Asiento bloqueado (estaba sin usuario)", 
            asiento: existente 
          });
        }

        // 2B: Mi bloqueo expirado - renovar
        if (bloqueadoPorMi && estaExpirado) {
          console.log(`🔄 Renovando bloqueo expirado: ${fila}${numero} - Usuario ${req.user.id}`);
          await existente.update({
            bloqueo_expira_en: new Date(Date.now() + 5 * 60 * 1000),
          });
          return res.json({ 
            mensaje: "Bloqueo renovado después de expiración", 
            asiento: existente 
          });
        }

        // 2C: Mi bloqueo vigente - extender
        if (bloqueadoPorMi && !estaExpirado) {
          console.log(`⏱️ Extendiendo bloqueo vigente: ${fila}${numero} - Usuario ${req.user.id}`);
          await existente.update({
            bloqueo_expira_en: new Date(Date.now() + 5 * 60 * 1000),
          });
          return res.json({ 
            mensaje: "Bloqueo extendido", 
            asiento: existente 
          });
        }

        // 2D: Bloqueado por otro usuario y expirado - tomar posesión
        if (!bloqueadoPorMi && estaExpirado) {
          console.log(`🔄 Tomando posesión de asiento expirado: ${fila}${numero} - Usuario ${req.user.id}`);
          await existente.update({
            id_usuario_bloqueo: req.user.id,
            bloqueo_expira_en: new Date(Date.now() + 5 * 60 * 1000),
          });
          return res.json({ 
            mensaje: "Asiento bloqueado (estaba expirado)", 
            asiento: existente 
          });
        }
        
        // 2E: Bloqueado por otro usuario y NO expirado - rechazar
        if (!bloqueadoPorMi && !estaExpirado) {
          return res
            .status(409)
            .json({ error: "El asiento está bloqueado por otro usuario" });
        }
      }
      
      // CASO 3: Asiento en estado libre - re-bloquear
      if (existente.estado === "libre") {
        console.log(`🔓 Re-bloqueando asiento libre: ${fila}${numero} - Usuario ${req.user.id}`);
        await existente.update({
          estado: "bloqueado",
          id_usuario_bloqueo: req.user.id,
          bloqueo_expira_en: new Date(Date.now() + 5 * 60 * 1000),
        });
        return res.json({ 
          mensaje: "Asiento bloqueado", 
          asiento: existente 
        });
      }
    }

    // CASO 4: Asiento no existe - crear nuevo (protegido contra duplicados)
    console.log(`🆕 Creando nuevo bloqueo: ${fila}${numero} - Usuario ${req.user.id}`);
    
    try {
      const [nuevo, created] = await AsientoFuncion.findOrCreate({
        where: { id_funcion, fila, numero },
        defaults: {
          estado: "bloqueado",
          id_usuario_bloqueo: req.user.id,
          bloqueo_expira_en: new Date(Date.now() + 5 * 60 * 1000),
        }
      });

      if (!created) {
        // El asiento fue creado por otra petición concurrente
        // Verificar si puedo tomarlo
        if (nuevo.estado === "bloqueado" && nuevo.id_usuario_bloqueo === req.user.id) {
          console.log(`✅ Bloqueo ya existía (petición duplicada): ${fila}${numero}`);
          return res.json({ 
            mensaje: "Asiento bloqueado correctamente (5 minutos)", 
            asiento: nuevo 
          });
        } else {
          return res.status(409).json({ 
            error: "El asiento fue tomado por otro usuario en este momento" 
          });
        }
      }

      res.json({ 
        mensaje: "Asiento bloqueado correctamente (5 minutos)", 
        asiento: nuevo 
      });
    } catch (error) {
      // Si aún así hay un error de llave duplicada, significa que se creó entre medias
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log(`⚠️ Race condition detectada: ${fila}${numero} - reintentando...`);
        
        // Buscar el asiento recién creado
        const asientoExistente = await AsientoFuncion.findOne({
          where: { id_funcion, fila, numero }
        });
        
        if (asientoExistente && asientoExistente.id_usuario_bloqueo === req.user.id) {
          return res.json({ 
            mensaje: "Asiento bloqueado correctamente (5 minutos)", 
            asiento: asientoExistente 
          });
        } else {
          return res.status(409).json({ 
            error: "El asiento fue tomado por otro usuario" 
          });
        }
      }
      throw error; // Re-lanzar si es otro tipo de error
    }
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

    // Si no existe, considerarlo como "ya liberado" y retornar éxito
    if (!asiento) {
      console.log(`✅ Asiento ${fila}${numero} ya fue liberado previamente`);
      return res.json({ 
        mensaje: "Asiento liberado correctamente",
        nota: "El asiento ya había sido liberado anteriormente" 
      });
    }

    // Verificar permisos
    if (
      req.user.rol !== "admin" &&
      asiento.id_usuario_bloqueo !== req.user.id
    ) {
      console.log(`⚠️ Usuario ${req.user.id} intentó liberar asiento bloqueado por usuario ${asiento.id_usuario_bloqueo}`);
      // No es un error - simplemente el asiento ya no es nuestro
      return res.json({ 
        mensaje: "El asiento ya no está bajo tu control",
        nota: "Otro usuario lo ha bloqueado mientras tanto"
      });
    }

    // No permitir liberar asientos ocupados definitivamente
    if (asiento.estado === "ocupado") {
      return res
        .status(400)
        .json({ error: "No se puede liberar un asiento ya ocupado" });
    }

    console.log(`🧹 Liberando asiento: ${fila}${numero} - Usuario ${req.user.id}`);
    await asiento.destroy();
    res.json({ mensaje: "Asiento liberado correctamente" });
  } catch (error) {
    console.error("Error liberarAsiento:", error);
    res.status(500).json({ error: "Error al liberar asiento" });
  }
};
