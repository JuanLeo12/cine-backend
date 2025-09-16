const { Funcion, Pelicula, Sala, Usuario, Pago } = require("../models");
const { Op } = require("sequelize");

// 📌 Obtener todas las funciones (público)
exports.listarFunciones = async (req, res) => {
  try {
    const funciones = await Funcion.findAll({
      include: [
        {
          model: Pelicula,
          attributes: ["id", "titulo", "genero", "clasificacion"],
        },
        { model: Sala, attributes: ["id", "nombre"] },
        {
          model: Usuario,
          as: "clienteCorporativo",
          attributes: ["id", "nombre", "email"],
        },
        {
          model: Pago,
          attributes: ["id", "monto_total", "estado_pago", "fecha_pago"],
        },
      ],
    });
    res.json(funciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener funciones" });
  }
};

// 📌 Obtener una función por ID (público)
exports.obtenerFuncion = async (req, res) => {
  try {
    const funcion = await Funcion.findByPk(req.params.id, {
      include: [
        { model: Pelicula },
        { model: Sala },
        { model: Usuario, as: "clienteCorporativo" },
        {
          model: Pago,
          attributes: ["id", "monto_total", "estado_pago", "fecha_pago"],
        },
      ],
    });

    if (!funcion) {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    res.json(funcion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener función" });
  }
};

// 📌 Crear nueva función (solo admin)
exports.crearFuncion = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para crear funciones" });
    }

    const {
      id_pelicula,
      id_sala,
      fecha,
      hora,
      es_privada = false,
      precio_corporativo,
      id_cliente_corporativo,
      id_pago,
    } = req.body;

    if (!id_pelicula || !id_sala || !fecha || !hora) {
      return res
        .status(400)
        .json({ error: "Campos obligatorios: película, sala, fecha y hora" });
    }

    // Validar existencia de película y sala
    const pelicula = await Pelicula.findByPk(id_pelicula);
    if (!pelicula)
      return res.status(404).json({ error: "Película no encontrada" });

    const sala = await Sala.findByPk(id_sala);
    if (!sala) return res.status(404).json({ error: "Sala no encontrada" });

    // Validar solapamiento en la misma sala
    const conflicto = await Funcion.findOne({
      where: {
        id_sala,
        fecha,
        hora,
      },
    });
    if (conflicto) {
      return res
        .status(409)
        .json({ error: "Ya existe una función en esa sala y horario" });
    }

    // Validaciones de coherencia
    if (es_privada) {
      if (!precio_corporativo || !id_cliente_corporativo) {
        return res.status(400).json({
          error:
            "Funciones privadas requieren cliente corporativo y precio corporativo",
        });
      }
    } else {
      if (precio_corporativo || id_cliente_corporativo) {
        return res.status(400).json({
          error:
            "Funciones públicas no deben tener cliente corporativo ni precio corporativo",
        });
      }
    }

    const nueva = await Funcion.create({
      id_pelicula,
      id_sala,
      fecha,
      hora,
      es_privada,
      precio_corporativo: es_privada ? precio_corporativo : null,
      id_cliente_corporativo: es_privada ? id_cliente_corporativo : null,
      id_pago: es_privada ? id_pago || null : null,
    });

    res.status(201).json(nueva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear función" });
  }
};

// 📌 Actualizar función (solo admin)
exports.actualizarFuncion = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para actualizar funciones" });
    }

    const funcion = await Funcion.findByPk(req.params.id);
    if (!funcion) {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    const { es_privada, precio_corporativo, id_cliente_corporativo } = req.body;

    // Validaciones de coherencia
    if (es_privada !== undefined) {
      if (es_privada) {
        if (!precio_corporativo || !id_cliente_corporativo) {
          return res.status(400).json({
            error:
              "Funciones privadas requieren cliente corporativo y precio corporativo",
          });
        }
      } else {
        if (precio_corporativo || id_cliente_corporativo) {
          return res.status(400).json({
            error:
              "Funciones públicas no deben tener cliente corporativo ni precio corporativo",
          });
        }
      }
    }

    await funcion.update(req.body);
    res.json(funcion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar función" });
  }
};

// 📌 Eliminar función (solo admin)
exports.eliminarFuncion = async (req, res) => {
  try {
    if (req.user?.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar funciones" });
    }

    const funcion = await Funcion.findByPk(req.params.id);
    if (!funcion) {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    // Aquí podrías validar si tiene ventas/reservas asociadas antes de eliminar
    await funcion.destroy();
    res.json({ mensaje: "Función eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar función" });
  }
};
