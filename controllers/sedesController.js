const { Sede, Sala, Publicidad, Funcion, Pelicula } = require("../models");
const { validarCamposSede } = require("../utils/validacionesSede");
const { Op } = require("sequelize");

// 📌 Listar todas las sedes
exports.listarSedes = async (req, res) => {
  try {
    const sedes = await Sede.findAll({
      where: { estado: 'activo' },
      order: [["nombre", "ASC"]],
      include: [
        { model: Sala, as: "salas", attributes: ["id", "nombre", "tipo_sala"] },
        { model: Publicidad, as: "publicidadesSede", attributes: ["id", "tipo"], required: false },
      ],
    });
    
    res.json(sedes);
  } catch (error) {
    console.error("Error en listarSedes:", error);
    res.status(500).json({ error: "Error al obtener sedes" });
  }
};

// 📌 Listar TODAS las sedes (incluyendo inactivas) - Para admin
exports.listarTodasLasSedes = async (req, res) => {
  try {
    const sedes = await Sede.findAll({
      order: [["estado", "DESC"], ["nombre", "ASC"]], // Activas primero
      include: [
        { model: Sala, as: "salas", attributes: ["id", "nombre", "tipo_sala"] },
        { model: Publicidad, as: "publicidadesSede", attributes: ["id", "tipo"], required: false },
      ],
    });
    
    res.json(sedes);
  } catch (error) {
    console.error("Error en listarTodasLasSedes:", error);
    res.status(500).json({ error: "Error al obtener sedes" });
  }
};

// 📌 Obtener una sede por ID
exports.obtenerSede = async (req, res) => {
  try {
    const sede = await Sede.findByPk(req.params.id, {
      include: [
        { model: Sala, as: "salas", attributes: ["id", "nombre"] },
        { model: Publicidad, as: "publicidadesSede", attributes: ["id", "tipo"], required: false },
      ],
    });

    if (!sede || sede.estado === "inactivo") return res.status(404).json({ error: "Sede no encontrada" });
    res.json(sede);
  } catch (error) {
    console.error("Error en obtenerSede:", error);
    res.status(500).json({ error: "Error al obtener sede" });
  }
};

// 📌 Crear nueva sede (con salas opcionales)
exports.crearSede = async (req, res) => {
  try {
    const { nombre, direccion, ciudad, telefono, imagen_url, salas } = req.body;

    // Validar todos los campos
    const errores = validarCamposSede({ nombre, direccion, ciudad, telefono, imagen_url });
    if (errores.length > 0) return res.status(400).json({ errores });

    // Buscar duplicados exactos (mismo nombre y ciudad, ignorando mayúsculas)
    const duplicado = await Sede.findOne({
      where: {
        nombre: {
          [Op.iLike]: nombre.trim() // Case-insensitive en PostgreSQL
        },
        ciudad: {
          [Op.iLike]: ciudad.trim()
        }
      }
    });
    
    if (duplicado) {
      return res
        .status(409)
        .json({ 
          error: `Ya existe una sede con el nombre "${duplicado.nombre}" en ${duplicado.ciudad}` 
        });
    }

    const nueva = await Sede.create({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      telefono: req.body.telefono,
      imagen_url: req.body.imagen_url,
    });

    // 🔹 Crear salas si se especificaron
    if (salas && Array.isArray(salas) && salas.length > 0) {
      for (const [index, salaData] of salas.entries()) {
        await Sala.create({
          nombre: salaData.nombre || `Sala ${index + 1}`,
          tipo_sala: salaData.tipo_sala || "2D",
          filas: salaData.filas || 10,
          columnas: salaData.columnas || 12,
          id_sede: nueva.id,
        });
      }
    }

    // Recargar sede con salas
    const sedeConSalas = await Sede.findByPk(nueva.id, {
      include: [{ model: Sala, as: "salas" }],
    });

    res.status(201).json({
      mensaje: "Sede creada correctamente",
      sede: sedeConSalas,
    });
  } catch (error) {
    console.error("Error en crearSede:", error);
    res.status(500).json({ error: "Error al registrar sede" });
  }
};

// 📌 Actualizar sede
exports.actualizarSede = async (req, res) => {
  try {
    const sede = await Sede.findByPk(req.params.id, {
      include: [{ model: Sala, as: "salas" }]
    });
    if (!sede) return res.status(404).json({ error: "Sede no encontrada" });

    const { nombre, direccion, ciudad, telefono, imagen_url, salas, confirmarEliminacion } = req.body;

    // Validar todos los campos (modo actualización)
    const errores = validarCamposSede({ nombre, direccion, ciudad, telefono, imagen_url }, true);
    if (errores.length > 0) return res.status(400).json({ errores });

    // Verificar duplicados si se está cambiando nombre o ciudad
    if (nombre && ciudad) {
      const duplicado = await Sede.findOne({
        where: {
          nombre: {
            [Op.iLike]: nombre.trim()
          },
          ciudad: {
            [Op.iLike]: ciudad.trim()
          }
        }
      });
      
      if (duplicado && duplicado.id !== sede.id) {
        return res.status(409).json({
          error: `Ya existe otra sede con el nombre "${duplicado.nombre}" en ${duplicado.ciudad}`,
        });
      }
    }

    // Actualizar datos básicos de la sede
    await sede.update({
      nombre: nombre?.trim() || sede.nombre,
      direccion: direccion?.trim() || sede.direccion,
      ciudad: ciudad?.trim() || sede.ciudad,
      telefono: telefono?.trim() || sede.telefono,
      imagen_url: imagen_url?.trim() || sede.imagen_url,
    });

    // 🔹 Si se envían salas, actualizar configuración
    if (salas && Array.isArray(salas)) {
      const salasActuales = sede.salas.map(s => s.id);
      const salasNuevas = salas.filter(s => s.id).map(s => s.id);
      const salasAEliminar = salasActuales.filter(id => !salasNuevas.includes(id));

      // Verificar si hay funciones activas en salas a eliminar
      if (salasAEliminar.length > 0 && !confirmarEliminacion) {
        const funcionesAfectadas = await Funcion.count({
          where: {
            id_sala: { [Op.in]: salasAEliminar },
            estado: "activa",
            fecha: { [Op.gte]: new Date().toISOString().split('T')[0] }
          }
        });

        if (funcionesAfectadas > 0) {
          return res.status(409).json({
            error: "Hay funciones activas en las salas que deseas eliminar",
            funcionesAfectadas,
            requiereConfirmacion: true,
            mensaje: `Se eliminarán ${funcionesAfectadas} funciones activas. Envía confirmarEliminacion: true para continuar.`
          });
        }
      }

      // Eliminar salas que ya no están
      if (salasAEliminar.length > 0) {
        // Desactivar funciones de las salas eliminadas
        await Funcion.update(
          { estado: "inactiva" },
          {
            where: {
              id_sala: { [Op.in]: salasAEliminar },
              estado: "activa"
            }
          }
        );

        // Eliminar las salas
        await Sala.destroy({
          where: { id: { [Op.in]: salasAEliminar } }
        });
      }

      // Actualizar salas existentes
      for (const salaData of salas.filter(s => s.id)) {
        await Sala.update(
          {
            nombre: salaData.nombre,
            tipo_sala: salaData.tipo_sala,
            filas: salaData.filas || 10,
            columnas: salaData.columnas || 12
          },
          { where: { id: salaData.id } }
        );
      }

      // Crear nuevas salas
      const salasACrear = salas.filter(s => !s.id);
      for (const salaData of salasACrear) {
        await Sala.create({
          nombre: salaData.nombre,
          tipo_sala: salaData.tipo_sala || "2D",
          filas: salaData.filas || 10,
          columnas: salaData.columnas || 12,
          id_sede: sede.id
        });
      }
    }

    // Recargar sede con salas actualizadas
    const sedeActualizada = await Sede.findByPk(sede.id, {
      include: [{ model: Sala, as: "salas" }]
    });

    res.json({ 
      mensaje: "Sede actualizada correctamente", 
      sede: sedeActualizada 
    });
  } catch (error) {
    console.error("Error en actualizarSede:", error);
    res.status(500).json({ error: "Error al actualizar sede" });
  }
};

// 📌 Eliminar sede (soft-delete sede + hard-delete salas/funciones)
exports.eliminarSede = async (req, res) => {
  try {
    const sede = await Sede.findByPk(req.params.id, {
      include: [{ model: Sala, as: "salas" }]
    });
    
    if (!sede) return res.status(404).json({ error: "Sede no encontrada" });

    // Obtener todas las salas de la sede
    const salasIds = sede.salas.map(s => s.id);
    let funcionesEliminadas = 0;
    let salasEliminadas = 0;

    if (salasIds.length > 0) {
      // Contar funciones que se eliminarán
      funcionesEliminadas = await Funcion.count({
        where: { id_sala: { [Op.in]: salasIds } }
      });

      // ELIMINAR PERMANENTEMENTE todas las funciones de las salas
      await Funcion.destroy({
        where: { id_sala: { [Op.in]: salasIds } }
      });

      // ELIMINAR PERMANENTEMENTE todas las salas
      await Sala.destroy({
        where: { id_sede: sede.id }
      });

      salasEliminadas = salasIds.length;

      console.log(`🗑️ Eliminadas ${funcionesEliminadas} funciones y ${salasEliminadas} salas de la sede ${sede.nombre}`);
    }

    // Verificar publicidad asociada
    const asociadaPublicidad = await Publicidad.findOne({
      where: { id_sede: sede.id },
    });
    if (asociadaPublicidad) {
      return res.status(400).json({
        error: "No se puede eliminar una sede con campañas publicitarias asociadas. Elimínelas primero.",
      });
    }

    // INACTIVAR la sede (soft-delete, recuperable)
    await sede.update({ estado: "inactivo" });
    
    res.json({ 
      mensaje: "Sede inactivada correctamente (recuperable). Salas y funciones eliminadas permanentemente.",
      funcionesEliminadas,
      salasEliminadas
    });
  } catch (error) {
    console.error("Error en eliminarSede:", error);
    res.status(500).json({ error: "Error al eliminar sede" });
  }
};

// 📌 Verificar impacto de modificar/eliminar salas
exports.verificarImpactoSalas = async (req, res) => {
  try {
    const { id } = req.params;
    const { salas } = req.body; // Array de IDs de salas que se mantendrán

    const sede = await Sede.findByPk(id, {
      include: [{ model: Sala, as: "salas" }]
    });

    if (!sede) {
      return res.status(404).json({ error: "Sede no encontrada" });
    }

    // Identificar salas que serían eliminadas
    const salasActuales = sede.salas.map(s => s.id);
    const salasAEliminar = salasActuales.filter(id => !salas.includes(id));

    if (salasAEliminar.length === 0) {
      return res.json({
        impacto: false,
        mensaje: "No hay salas para eliminar",
        funcionesAfectadas: []
      });
    }

    // Buscar funciones activas en las salas a eliminar
    const funcionesAfectadas = await Funcion.findAll({
      where: {
        id_sala: { [Op.in]: salasAEliminar },
        estado: "activa",
        fecha: { [Op.gte]: new Date().toISOString().split('T')[0] }
      },
      include: [
        { model: Pelicula, as: "pelicula", attributes: ["titulo"] },
        { model: Sala, as: "sala", attributes: ["nombre"] }
      ],
      order: [["fecha", "ASC"], ["hora", "ASC"]]
    });

    res.json({
      impacto: funcionesAfectadas.length > 0,
      salasAfectadas: salasAEliminar.length,
      funcionesAfectadas: funcionesAfectadas.map(f => ({
        id: f.id,
        sala: f.sala.nombre,
        pelicula: f.pelicula.titulo,
        fecha: f.fecha,
        hora: f.hora
      })),
      mensaje: funcionesAfectadas.length > 0
        ? `Se eliminarán ${funcionesAfectadas.length} funciones activas`
        : "No hay funciones activas afectadas"
    });
  } catch (error) {
    console.error("Error en verificarImpactoSalas:", error);
    res.status(500).json({ error: "Error al verificar impacto" });
  }
};

// 📌 Reactivar sede inactiva
exports.reactivarSede = async (req, res) => {
  try {
    const sede = await Sede.findByPk(req.params.id);
    
    if (!sede) {
      return res.status(404).json({ error: "Sede no encontrada" });
    }

    if (sede.estado === "activo") {
      return res.status(400).json({ error: "La sede ya está activa" });
    }

    // Reactivar la sede
    await sede.update({ estado: "activo" });

    res.json({
      mensaje: "Sede reactivada correctamente. Ahora puedes crear salas desde el panel de edición.",
      sede
    });
  } catch (error) {
    console.error("Error en reactivarSede:", error);
    res.status(500).json({ error: "Error al reactivar sede" });
  }
};
