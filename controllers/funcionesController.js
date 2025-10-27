const { Funcion, Pelicula, Sala, Sede, Usuario } = require("../models");
const { Op } = require("sequelize");

// 📌 Obtener todas las funciones (solo activas)
exports.listarFunciones = async (req, res) => {
  try {
    const funciones = await Funcion.findAll({
      where: { estado: "activa" },
      include: [
        {
          model: Pelicula,
          as: "pelicula",
          attributes: ["id", "titulo", "genero", "imagen_url", "duracion"],
        },
        { 
          model: Sala, 
          as: "sala", 
          attributes: ["id", "nombre", "filas", "columnas"],
          include: [
            {
              model: Sede,
              as: "sede",
              // Filtrar solo sedes activas para evitar mostrar sedes "fantasma"
              where: { estado: 'activo' },
              attributes: ["id", "nombre", "ciudad", "direccion", "imagen_url"]
            }
          ]
        },
        {
          model: Usuario,
          as: "clienteCorporativo",
          attributes: ["id", "nombre"],
        },
      ],
      order: [['fecha', 'ASC'], ['hora', 'ASC']]
    });
    res.json(funciones);
  } catch (error) {
    console.error("Error listarFunciones:", error);
    res.status(500).json({ error: "Error al obtener funciones" });
  }
};

// 📌 Obtener TODAS las funciones (incluyendo inactivas) - Para análisis admin
exports.listarTodasFunciones = async (req, res) => {
  try {
    const funciones = await Funcion.findAll({
      include: [
        {
          model: Pelicula,
          as: "pelicula",
          attributes: ["id", "titulo", "genero", "imagen_url", "duracion"],
        },
        { 
          model: Sala, 
          as: "sala", 
          attributes: ["id", "nombre", "filas", "columnas"],
          include: [
            {
              model: Sede,
              as: "sede",
              attributes: ["id", "nombre", "ciudad", "direccion", "imagen_url"]
            }
          ]
        },
        {
          model: Usuario,
          as: "clienteCorporativo",
          attributes: ["id", "nombre"],
        },
      ],
      order: [['fecha', 'ASC'], ['hora', 'ASC']]
    });
    res.json(funciones);
  } catch (error) {
    console.error("Error listarTodasFunciones:", error);
    res.status(500).json({ error: "Error al obtener funciones" });
  }
};

// 📌 Desactivar funciones pasadas automáticamente
exports.desactivarFuncionesPasadas = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const horaActual = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

    // Desactivar funciones con fecha anterior a hoy
    const resultadoFechasPasadas = await Funcion.update(
      { estado: "inactiva" },
      {
        where: {
          fecha: { [Op.lt]: hoy },
          estado: "activa"
        }
      }
    );

    const totalDesactivadas = resultadoFechasPasadas[0];

    res.json({
      message: `✅ Se desactivaron ${totalDesactivadas} funciones pasadas (fechas anteriores a hoy)`,
      desactivadas: totalDesactivadas,
    });
  } catch (error) {
    console.error("Error desactivarFuncionesPasadas:", error);
    res.status(500).json({ error: "Error al desactivar funciones" });
  }
};

// 📌 Desactivar función específica
exports.desactivarFuncion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const funcion = await Funcion.findByPk(id);
    if (!funcion) {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    funcion.estado = "inactiva";
    await funcion.save();

    res.json({ message: "✅ Función desactivada exitosamente", funcion });
  } catch (error) {
    console.error("Error desactivarFuncion:", error);
    res.status(500).json({ error: "Error al desactivar función" });
  }
};

// 📌 Obtener funciones por película
exports.obtenerFuncionesByPelicula = async (req, res) => {
  try {
    const { id_pelicula } = req.params;
    
    // Solo devolver funciones activas y cuya sede esté activa (evita sedes fantasma)
    const funciones = await Funcion.findAll({
      where: { 
        id_pelicula,
        estado: "activa" 
      },
      include: [
        {
          model: Sala,
          as: "sala",
          attributes: ["id", "nombre", "filas", "columnas"],
          include: [
            {
              model: Sede,
              as: "sede",
              where: { estado: 'activo' },
              attributes: ["id", "nombre", "direccion", "ciudad", "imagen_url"]
            }
          ]
        },
        {
          model: Pelicula,
          as: "pelicula",
          attributes: ["id", "titulo", "imagen_url", "duracion", "clasificacion"]
        }
      ],
      order: [['fecha', 'ASC'], ['hora', 'ASC']]
    });

    res.json(funciones);
  } catch (error) {
    console.error("Error obtenerFuncionesByPelicula:", error);
    res.status(500).json({ error: "Error al obtener funciones" });
  }
};

// 📌 Obtener una función por ID
exports.obtenerFuncion = async (req, res) => {
  try {
    const funcion = await Funcion.findOne({
      where: { id: req.params.id, estado: "activa" },
      include: [
        { model: Pelicula, as: "pelicula" },
        { model: Sala, as: "sala" },
        { model: Usuario, as: "clienteCorporativo" },
      ],
    });

    if (!funcion) {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    res.json(funcion);
  } catch (error) {
    console.error("Error obtenerFuncion:", error);
    res.status(500).json({ error: "Error al obtener función" });
  }
};

// 📌 Crear nueva función
exports.crearFuncion = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { fecha, hora, id_pelicula, id_sala } = req.body;

    if (!fecha || !hora || !id_pelicula || !id_sala) {
      return res
        .status(400)
        .json({ error: "Campos obligatorios: película, sala, fecha y hora" });
    }

    const nueva = await Funcion.create(req.body);
    res.status(201).json({ mensaje: "Función creada correctamente", funcion: nueva });
  } catch (error) {
    console.error("Error crearFuncion:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ error: "Ya existe una función en esa sala, fecha y hora" });
    }
    res.status(500).json({ error: "Error al crear función" });
  }
};

// 📌 Actualizar función
exports.actualizarFuncion = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { fecha, hora, id_pelicula, id_sala } = req.body;

    if (!fecha || !hora || !id_pelicula || !id_sala) {
      return res
        .status(400)
        .json({ error: "Campos obligatorios: película, sala, fecha y hora" });
    }

    const funcion = await Funcion.findByPk(req.params.id);
    if (!funcion || funcion.estado === "inactiva") {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    await funcion.update(req.body);
    res.json({ mensaje: "Función actualizada correctamente", funcion });
  } catch (error) {
    console.error("Error actualizarFuncion:", error);
    res.status(500).json({ error: "Error al actualizar función" });
  }
};

// 📌 Eliminar función (soft delete)
exports.eliminarFuncion = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const funcion = await Funcion.findByPk(req.params.id);
    if (!funcion || funcion.estado === "inactiva") {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    await funcion.update({ estado: "inactiva" });
    res.json({ mensaje: "Función cancelada correctamente" });
  } catch (error) {
    console.error("Error eliminarFuncion:", error);
    res.status(500).json({ error: "Error al eliminar función" });
  }
};
