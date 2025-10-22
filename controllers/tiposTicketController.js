const { TipoTicket, Usuario, TarifaCorporativa } = require("../models");
const { validarTipoTicket } = require("../utils/validacionesTipoTicket");

// 📌 Obtener todos los tipos de ticket (público o autenticado)
exports.listarTipos = async (req, res) => {
  try {
    const tipos = await TipoTicket.findAll({
      where: { estado: "activo" },
      attributes: ["id", "nombre"],
    });
    res.json(tipos);
  } catch (error) {
    console.error("Error listarTipos:", error);
    res.status(500).json({ error: "Error al obtener tipos de ticket" });
  }
};

// 📌 Obtener un tipo de ticket por ID (público o autenticado)
exports.obtenerTipo = async (req, res) => {
  try {
    const tipo = await TipoTicket.findByPk(req.params.id);
    if (!tipo || tipo.estado === "inactivo") {
      return res.status(404).json({ error: "Tipo de ticket no encontrado" });
    }
    res.json(tipo);
  } catch (error) {
    console.error("Error obtenerTipo:", error);
    res.status(500).json({ error: "Error al obtener tipo de ticket" });
  }
};

// 📌 Crear nuevo tipo de ticket (solo admin)
exports.crearTipo = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para crear tipos de ticket" });
    }

    const { nombre } = req.body;
    const { errores, nombreNormalizado } = validarTipoTicket({ nombre });
    if (errores.length > 0) return res.status(400).json({ errores });

    const existe = await TipoTicket.findOne({
      where: { nombre: nombreNormalizado },
    });
    if (existe)
      return res.status(409).json({ error: "El tipo de ticket ya existe" });

    const nuevo = await TipoTicket.create({ nombre: nombreNormalizado });
    res
      .status(201)
      .json({ mensaje: "Tipo de ticket creado correctamente", tipo: nuevo });
  } catch (error) {
    console.error("Error crearTipo:", error);
    res.status(500).json({ error: "Error al registrar tipo de ticket" });
  }
};

// 📌 Actualizar tipo de ticket (solo admin)
exports.actualizarTipo = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar tipos de ticket" });
    }

    const tipo = await TipoTicket.findByPk(req.params.id);
    if (!tipo)
      return res.status(404).json({ error: "Tipo de ticket no encontrado" });

    const { nombre } = req.body;
    if (nombre) {
      const { errores, nombreNormalizado } = validarTipoTicket({ nombre });
      if (errores.length > 0) return res.status(400).json({ errores });

      const existe = await TipoTicket.findOne({
        where: { nombre: nombreNormalizado },
      });
      if (existe && existe.id !== tipo.id) {
        return res
          .status(409)
          .json({ error: "Ya existe otro tipo de ticket con ese nombre" });
      }
      tipo.nombre = nombreNormalizado;
    }

    await tipo.save();
    res.json({ mensaje: "Tipo de ticket actualizado correctamente", tipo });
  } catch (error) {
    console.error("Error actualizarTipo:", error);
    res.status(500).json({ error: "Error al actualizar tipo de ticket" });
  }
};

// 📌 Eliminar tipo de ticket (solo admin)
exports.eliminarTipo = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar tipos de ticket" });
    }

    const tipo = await TipoTicket.findByPk(req.params.id);
    if (!tipo)
      return res.status(404).json({ error: "Tipo de ticket no encontrado" });

    const asociadoTarifa = await TarifaCorporativa.findOne({
      where: { id_tipo_usuario: tipo.id },
    });
    if (asociadoTarifa) {
      return res
        .status(400)
        .json({
          error:
            "No se puede eliminar un tipo de ticket con tarifas asociadas",
        });
    }

    await tipo.update({ estado: "inactivo" });
    res.json({ mensaje: "Tipo de ticket inactivado correctamente" });
  } catch (error) {
    console.error("Error eliminarTipo:", error);
    res.status(500).json({ error: "Error al eliminar tipo de ticket" });
  }
};
