const { TipoUsuario, Usuario, TarifaCorporativa } = require("../models");
const { validarTipoUsuario } = require("../utils/validacionesTipoUsuario");

// 📌 Obtener todos los tipos de usuario (público o autenticado)
exports.listarTipos = async (req, res) => {
  try {
    const tipos = await TipoUsuario.findAll({
      attributes: ["id", "nombre"],
    });
    res.json(tipos);
  } catch (error) {
    console.error("Error listarTipos:", error);
    res.status(500).json({ error: "Error al obtener tipos de usuario" });
  }
};

// 📌 Obtener un tipo de usuario por ID (público o autenticado)
exports.obtenerTipo = async (req, res) => {
  try {
    const tipo = await TipoUsuario.findByPk(req.params.id);
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de usuario no encontrado" });
    }
    res.json(tipo);
  } catch (error) {
    console.error("Error obtenerTipo:", error);
    res.status(500).json({ error: "Error al obtener tipo de usuario" });
  }
};

// 📌 Crear nuevo tipo de usuario (solo admin)
exports.crearTipo = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para crear tipos de usuario" });
    }

    const { nombre } = req.body;
    const { errores, nombreNormalizado } = validarTipoUsuario({ nombre });
    if (errores.length > 0) return res.status(400).json({ errores });

    const existe = await TipoUsuario.findOne({
      where: { nombre: nombreNormalizado },
    });
    if (existe)
      return res.status(409).json({ error: "El tipo de usuario ya existe" });

    const nuevo = await TipoUsuario.create({ nombre: nombreNormalizado });
    res
      .status(201)
      .json({ mensaje: "Tipo de usuario creado correctamente", tipo: nuevo });
  } catch (error) {
    console.error("Error crearTipo:", error);
    res.status(500).json({ error: "Error al registrar tipo de usuario" });
  }
};

// 📌 Actualizar tipo de usuario (solo admin)
exports.actualizarTipo = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar tipos de usuario" });
    }

    const tipo = await TipoUsuario.findByPk(req.params.id);
    if (!tipo)
      return res.status(404).json({ error: "Tipo de usuario no encontrado" });

    const { nombre } = req.body;
    if (nombre) {
      const { errores, nombreNormalizado } = validarTipoUsuario({ nombre });
      if (errores.length > 0) return res.status(400).json({ errores });

      const existe = await TipoUsuario.findOne({
        where: { nombre: nombreNormalizado },
      });
      if (existe && existe.id !== tipo.id) {
        return res
          .status(409)
          .json({ error: "Ya existe otro tipo de usuario con ese nombre" });
      }
      tipo.nombre = nombreNormalizado;
    }

    await tipo.save();
    res.json({ mensaje: "Tipo de usuario actualizado correctamente", tipo });
  } catch (error) {
    console.error("Error actualizarTipo:", error);
    res.status(500).json({ error: "Error al actualizar tipo de usuario" });
  }
};

// 📌 Eliminar tipo de usuario (solo admin)
exports.eliminarTipo = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar tipos de usuario" });
    }

    const tipo = await TipoUsuario.findByPk(req.params.id);
    if (!tipo)
      return res.status(404).json({ error: "Tipo de usuario no encontrado" });

    const asociadoUsuario = await Usuario.findOne({
      where: { id_tipo_usuario: tipo.id },
    });
    if (asociadoUsuario) {
      return res
        .status(400)
        .json({
          error:
            "No se puede eliminar un tipo de usuario con usuarios asociados",
        });
    }

    const asociadoTarifa = await TarifaCorporativa.findOne({
      where: { id_tipo_usuario: tipo.id },
    });
    if (asociadoTarifa) {
      return res
        .status(400)
        .json({
          error:
            "No se puede eliminar un tipo de usuario con tarifas asociadas",
        });
    }

    await tipo.destroy();
    res.json({ mensaje: "Tipo de usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminarTipo:", error);
    res.status(500).json({ error: "Error al eliminar tipo de usuario" });
  }
};
