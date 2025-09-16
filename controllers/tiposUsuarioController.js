const { TipoUsuario, Usuario, TarifaCorporativa } = require("../models");

// 📌 Obtener todos los tipos de usuario (público o autenticado)
exports.listarTipos = async (req, res) => {
  try {
    const tipos = await TipoUsuario.findAll({
      attributes: ["id", "nombre", "descripcion", "descuento"],
    });
    res.json(tipos);
  } catch (error) {
    console.error(error);
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
    console.error(error);
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

    const { nombre, descripcion, descuento } = req.body;

    if (!nombre || descuento === undefined) {
      return res
        .status(400)
        .json({ error: "Nombre y descuento son obligatorios" });
    }

    if (isNaN(descuento) || descuento < 0 || descuento > 100) {
      return res
        .status(400)
        .json({ error: "El descuento debe ser un número entre 0 y 100" });
    }

    const existe = await TipoUsuario.findOne({
      where: { nombre: nombre.trim() },
    });
    if (existe) {
      return res.status(409).json({ error: "El tipo de usuario ya existe" });
    }

    const nuevo = await TipoUsuario.create({
      nombre: nombre.trim(),
      descripcion,
      descuento,
    });
    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
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
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de usuario no encontrado" });
    }

    const { nombre, descuento } = req.body;

    if (descuento !== undefined) {
      if (isNaN(descuento) || descuento < 0 || descuento > 100) {
        return res
          .status(400)
          .json({ error: "El descuento debe ser un número entre 0 y 100" });
      }
    }

    if (nombre) {
      const existe = await TipoUsuario.findOne({
        where: { nombre: nombre.trim() },
      });
      if (existe && existe.id !== tipo.id) {
        return res
          .status(409)
          .json({ error: "Ya existe otro tipo de usuario con ese nombre" });
      }
    }

    await tipo.update({
      ...req.body,
      nombre: nombre?.trim() || tipo.nombre,
    });
    res.json(tipo);
  } catch (error) {
    console.error(error);
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
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de usuario no encontrado" });
    }

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
    console.error(error);
    res.status(500).json({ error: "Error al eliminar tipo de usuario" });
  }
};
