const { Funcion, Pelicula, Sala, Sede, Usuario } = require("../models");
const { Op } = require("sequelize");
const { 
  calcularHoraFin, 
  calcularHoraFinFuncionPrivada,
  verificarDisponibilidadSala,
  DURACION_FUNCION_PRIVADA_MINUTOS
} = require("../utils/disponibilidadSalas");

// 📌 Obtener todas las funciones (solo activas y NO privadas para público)
exports.listarFunciones = async (req, res) => {
  try {
    const funciones = await Funcion.findAll({
      where: { 
        estado: "activa",
        es_privada: false // Solo funciones públicas
      },
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
    
    // Solo devolver funciones activas, públicas y cuya sede esté activa (evita sedes fantasma)
    const funciones = await Funcion.findAll({
      where: { 
        id_pelicula,
        estado: "activa",
        es_privada: false // Solo funciones públicas
      },
      include: [
        {
          model: Sala,
          as: "sala",
          attributes: ["id", "nombre", "tipo_sala", "filas", "columnas"],
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
    console.log('📝 Datos recibidos para crear función:', JSON.stringify(req.body, null, 2));
    
    const { fecha, hora, id_pelicula, id_sala, es_privada } = req.body;

    // Validar permisos: Admin puede crear cualquier función, Cliente solo puede crear funciones privadas
    if (req.user?.rol === "admin") {
      // Admin puede crear cualquier tipo de función
    } else if (req.user?.rol === "cliente" || req.user?.rol === "corporativo") {
      // Clientes y corporativos solo pueden crear funciones privadas
      if (!es_privada) {
        return res.status(403).json({ 
          error: "Los clientes solo pueden crear funciones privadas" 
        });
      }
    } else {
      return res.status(403).json({ error: "No autorizado" });
    }

    if (!fecha || !hora || !id_pelicula || !id_sala) {
      return res
        .status(400)
        .json({ error: "Campos obligatorios: película, sala, fecha y hora" });
    }

    // 🕐 Validar que no se cree función en horario pasado (zona horaria Perú UTC-5)
    const fechaHoraFuncion = new Date(`${fecha}T${hora}-05:00`);
    const ahora = new Date();
    
    if (fechaHoraFuncion < ahora) {
      const diferencia = Math.round((ahora - fechaHoraFuncion) / 60000); // minutos
      return res.status(400).json({ 
        error: "No se puede crear una función en un horario que ya pasó",
        detalles: `La función sería ${diferencia} minuto${diferencia !== 1 ? 's' : ''} en el pasado`,
        fecha_funcion: fechaHoraFuncion.toISOString(),
        fecha_actual: ahora.toISOString()
      });
    }

    // 1. Obtener duración de la película
    const pelicula = await Pelicula.findByPk(id_pelicula);
    if (!pelicula) {
      return res.status(404).json({ error: "Película no encontrada" });
    }

    // 2. Calcular hora_fin: 
    // - Funciones privadas: SIEMPRE 3 horas
    // - Funciones normales: duración de la película
    let hora_fin;
    if (es_privada) {
      hora_fin = calcularHoraFinFuncionPrivada(hora);
      console.log(`🎬 Función Privada: 3 horas fijas (${hora} - ${hora_fin})`);
    } else {
      hora_fin = calcularHoraFin(hora, pelicula.duracion || 120);
      console.log(`🎬 Función Normal: ${pelicula.duracion || 120} minutos (${hora} - ${hora_fin})`);
    }

    // 3. Verificar disponibilidad de la sala
    const disponibilidad = await verificarDisponibilidadSala(
      id_sala,
      fecha,
      hora,
      hora_fin
    );

    if (!disponibilidad.disponible) {
      return res.status(409).json({
        error: "La sala no está disponible en ese horario",
        conflictos: disponibilidad.conflictos,
        mensaje: `Conflictos encontrados: ${disponibilidad.conflictos.map(c => 
          `${c.titulo} (${c.hora_inicio} - ${c.hora_fin})`
        ).join(', ')}`
      });
    }

    // 4. Crear función con hora_fin calculada
    // Si es función privada, asignar id_cliente_corporativo
    const dataFuncion = {
      ...req.body,
      hora_inicio: hora,
      hora_fin: hora_fin
    };

    if (es_privada && (req.user?.rol === "cliente" || req.user?.rol === "corporativo")) {
      dataFuncion.id_cliente_corporativo = req.user.id;
    }

    console.log('💰 Datos de función a crear:', JSON.stringify(dataFuncion, null, 2));
    console.log('💰 Precio corporativo recibido:', dataFuncion.precio_corporativo);

    const nueva = await Funcion.create(dataFuncion);

    res.status(201).json({ 
      mensaje: es_privada 
        ? `Función privada creada correctamente (3 horas: ${hora} - ${hora_fin})`
        : "Función creada correctamente", 
      funcion: nueva,
      hora_fin_calculada: hora_fin,
      duracion_minutos: es_privada ? DURACION_FUNCION_PRIVADA_MINUTOS : pelicula.duracion,
      id: nueva.id // Incluir ID para crear boleta
    });
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

    // 🕐 Validar que no se actualice a un horario pasado (zona horaria Perú UTC-5)
    const fechaHoraFuncion = new Date(`${fecha}T${hora}-05:00`);
    const ahora = new Date();
    
    if (fechaHoraFuncion < ahora) {
      const diferencia = Math.round((ahora - fechaHoraFuncion) / 60000); // minutos
      return res.status(400).json({ 
        error: "No se puede programar una función en un horario que ya pasó",
        detalles: `El horario sería ${diferencia} minuto${diferencia !== 1 ? 's' : ''} en el pasado`,
        fecha_funcion: fechaHoraFuncion.toISOString(),
        fecha_actual: ahora.toISOString()
      });
    }

    const funcion = await Funcion.findByPk(req.params.id);
    if (!funcion || funcion.estado === "inactiva") {
      return res.status(404).json({ error: "Función no encontrada" });
    }

    // 1. Obtener duración de la película
    const pelicula = await Pelicula.findByPk(id_pelicula);
    if (!pelicula) {
      return res.status(404).json({ error: "Película no encontrada" });
    }

    // 2. Calcular hora_fin automáticamente
    const hora_fin = calcularHoraFin(hora, pelicula.duracion || 120);

    // 3. Verificar disponibilidad (excluyendo esta función)
    const disponibilidad = await verificarDisponibilidadSala(
      id_sala,
      fecha,
      hora,
      hora_fin,
      req.params.id // Excluir la función actual de la verificación
    );

    if (!disponibilidad.disponible) {
      return res.status(409).json({
        error: "La sala no está disponible en ese horario",
        conflictos: disponibilidad.conflictos,
        mensaje: `Conflictos encontrados: ${disponibilidad.conflictos.map(c => 
          `${c.titulo} (${c.hora_inicio} - ${c.hora_fin})`
        ).join(', ')}`
      });
    }

    // 4. Actualizar con hora_fin calculada
    await funcion.update({
      ...req.body,
      hora_inicio: hora,
      hora_fin: hora_fin
    });

    res.json({ 
      mensaje: "Función actualizada correctamente", 
      funcion,
      hora_fin_calculada: hora_fin
    });
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
