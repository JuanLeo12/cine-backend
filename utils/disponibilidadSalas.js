/**
 * Utils para gestión de disponibilidad de salas
 * Maneja validación de horarios y conflictos entre funciones/alquileres
 */

const { Funcion, AlquilerSala, Pelicula } = require('../models');
const { Op } = require('sequelize');

/**
 * Calcula la hora de fin sumando minutos a una hora de inicio
 * @param {string} horaInicio - Hora en formato "HH:MM" (ej: "14:30")
 * @param {number} duracionMinutos - Duración en minutos
 * @returns {string} Hora de fin en formato "HH:MM"
 */
const calcularHoraFin = (horaInicio, duracionMinutos) => {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  
  // Convertir todo a minutos
  const minutosInicio = horas * 60 + minutos;
  const minutosFin = minutosInicio + duracionMinutos;
  
  // Convertir de vuelta a horas y minutos
  const horasFin = Math.floor(minutosFin / 60);
  const minutosRestantes = minutosFin % 60;
  
  // Formatear con ceros a la izquierda
  return `${String(horasFin).padStart(2, '0')}:${String(minutosRestantes).padStart(2, '0')}`;
};

/**
 * Verifica si una sala está disponible en un rango de horario específico
 * @param {number} idSala - ID de la sala
 * @param {string} fecha - Fecha en formato "YYYY-MM-DD"
 * @param {string} horaInicio - Hora de inicio en formato "HH:MM"
 * @param {string} horaFin - Hora de fin en formato "HH:MM"
 * @param {number} excluirIdFuncion - ID de función a excluir (para ediciones)
 * @param {number} excluirIdAlquiler - ID de alquiler a excluir (para ediciones)
 * @returns {Promise<{disponible: boolean, conflictos: Array}>}
 */
const verificarDisponibilidadSala = async (
  idSala,
  fecha,
  horaInicio,
  horaFin,
  excluirIdFuncion = null,
  excluirIdAlquiler = null
) => {
  try {
    const conflictos = [];

    // 1. Verificar conflictos con funciones regulares
    const whereClauseFunciones = {
      id_sala: idSala,
      fecha: fecha,
      estado: { [Op.ne]: 'cancelada' }
    };

    if (excluirIdFuncion) {
      whereClauseFunciones.id = { [Op.ne]: excluirIdFuncion };
    }

    const funcionesExistentes = await Funcion.findAll({
      where: whereClauseFunciones,
      include: [{
        model: Pelicula,
        as: 'pelicula', // Usar el alias correcto
        attributes: ['titulo', 'duracion']
      }]
    });

    // Verificar solapamiento de horarios con funciones
    for (const funcion of funcionesExistentes) {
      if (hayConflictoHorario(horaInicio, horaFin, funcion.hora_inicio, funcion.hora_fin)) {
        conflictos.push({
          tipo: 'funcion',
          id: funcion.id,
          titulo: funcion.Pelicula?.titulo || 'Función regular',
          hora_inicio: funcion.hora_inicio,
          hora_fin: funcion.hora_fin
        });
      }
    }

    // 2. Verificar conflictos con alquileres de sala
    const whereClauseAlquileres = {
      id_sala: idSala,
      fecha: fecha
    };

    if (excluirIdAlquiler) {
      whereClauseAlquileres.id = { [Op.ne]: excluirIdAlquiler };
    }

    const alquileresExistentes = await AlquilerSala.findAll({
      where: whereClauseAlquileres
    });

    // Verificar solapamiento de horarios con alquileres
    for (const alquiler of alquileresExistentes) {
      if (hayConflictoHorario(horaInicio, horaFin, alquiler.hora_inicio, alquiler.hora_fin)) {
        conflictos.push({
          tipo: 'alquiler',
          id: alquiler.id,
          titulo: 'Alquiler de sala',
          hora_inicio: alquiler.hora_inicio,
          hora_fin: alquiler.hora_fin
        });
      }
    }

    return {
      disponible: conflictos.length === 0,
      conflictos
    };
  } catch (error) {
    console.error('Error verificando disponibilidad de sala:', error);
    throw error;
  }
};

/**
 * Verifica si dos rangos de horarios se solapan
 * @param {string} inicio1 - Hora de inicio del primer rango "HH:MM"
 * @param {string} fin1 - Hora de fin del primer rango "HH:MM"
 * @param {string} inicio2 - Hora de inicio del segundo rango "HH:MM"
 * @param {string} fin2 - Hora de fin del segundo rango "HH:MM"
 * @returns {boolean} True si hay conflicto
 */
const hayConflictoHorario = (inicio1, fin1, inicio2, fin2) => {
  // Convertir a minutos desde medianoche para comparación
  const minutos1Inicio = horaAMinutos(inicio1);
  const minutos1Fin = horaAMinutos(fin1);
  const minutos2Inicio = horaAMinutos(inicio2);
  const minutos2Fin = horaAMinutos(fin2);

  // Hay conflicto si:
  // - El inicio1 está entre inicio2 y fin2
  // - El fin1 está entre inicio2 y fin2
  // - El rango1 contiene completamente al rango2
  return (
    (minutos1Inicio >= minutos2Inicio && minutos1Inicio < minutos2Fin) ||
    (minutos1Fin > minutos2Inicio && minutos1Fin <= minutos2Fin) ||
    (minutos1Inicio <= minutos2Inicio && minutos1Fin >= minutos2Fin)
  );
};

/**
 * Convierte una hora en formato "HH:MM" a minutos desde medianoche
 * @param {string} hora - Hora en formato "HH:MM"
 * @returns {number} Minutos desde medianoche
 */
const horaAMinutos = (hora) => {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};

/**
 * Obtiene los horarios disponibles de una sala en una fecha específica
 * Considera un horario de operación estándar del cine (11:00 - 23:00)
 * @param {number} idSala - ID de la sala
 * @param {string} fecha - Fecha en formato "YYYY-MM-DD"
 * @param {number} duracionMinutos - Duración necesaria en minutos
 * @returns {Promise<Array<{hora_inicio: string, hora_fin: string}>>}
 */
const obtenerHorariosDisponibles = async (idSala, fecha, duracionMinutos) => {
  try {
    const horariosDisponibles = [];
    const horaApertura = '11:00';
    const horaCierre = '23:00';
    const intervaloMinutos = 30; // Intervalos de 30 minutos

    // Obtener todas las funciones y alquileres del día
    const funcionesDelDia = await Funcion.findAll({
      where: {
        id_sala: idSala,
        fecha: fecha,
        estado: { [Op.ne]: 'cancelada' }
      },
      order: [['hora_inicio', 'ASC']]
    });

    const alquileresDelDia = await AlquilerSala.findAll({
      where: {
        id_sala: idSala,
        fecha: fecha
      },
      order: [['hora_inicio', 'ASC']]
    });

    // Crear lista de bloques ocupados
    const bloquesOcupados = [
      ...funcionesDelDia.map(f => ({ inicio: f.hora_inicio, fin: f.hora_fin })),
      ...alquileresDelDia.map(a => ({ inicio: a.hora_inicio, fin: a.hora_fin }))
    ].sort((a, b) => horaAMinutos(a.inicio) - horaAMinutos(b.inicio));

    // Iterar por intervalos y verificar disponibilidad
    let horaActual = horaApertura;
    while (horaAMinutos(horaActual) + duracionMinutos <= horaAMinutos(horaCierre)) {
      const horaFinCalculada = calcularHoraFin(horaActual, duracionMinutos);
      
      // Verificar si este bloque tiene conflictos
      let tieneConflicto = false;
      for (const bloque of bloquesOcupados) {
        if (hayConflictoHorario(horaActual, horaFinCalculada, bloque.inicio, bloque.fin)) {
          tieneConflicto = true;
          // Saltar al final de este bloque ocupado
          horaActual = bloque.fin;
          break;
        }
      }

      if (!tieneConflicto) {
        horariosDisponibles.push({
          hora_inicio: horaActual,
          hora_fin: horaFinCalculada
        });
        // Avanzar al siguiente intervalo
        horaActual = calcularHoraFin(horaActual, intervaloMinutos);
      }
    }

    return horariosDisponibles;
  } catch (error) {
    console.error('Error obteniendo horarios disponibles:', error);
    throw error;
  }
};

/**
 * Duración fija para funciones privadas: 3 horas
 */
const DURACION_FUNCION_PRIVADA_MINUTOS = 180;

/**
 * Calcula hora de fin para función privada (siempre 3 horas)
 * @param {string} horaInicio - Hora en formato "HH:MM"
 * @returns {string} Hora de fin (hora_inicio + 3 horas)
 */
const calcularHoraFinFuncionPrivada = (horaInicio) => {
  return calcularHoraFin(horaInicio, DURACION_FUNCION_PRIVADA_MINUTOS);
};

module.exports = {
  calcularHoraFin,
  calcularHoraFinFuncionPrivada,
  verificarDisponibilidadSala,
  hayConflictoHorario,
  horaAMinutos,
  obtenerHorariosDisponibles,
  DURACION_FUNCION_PRIVADA_MINUTOS
};
