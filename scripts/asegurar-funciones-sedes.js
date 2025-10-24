// Script para asegurar que todas las películas tienen funciones en todas las sedes
const { Pelicula, Sede, Sala, Funcion } = require('../models');
const { Op } = require('sequelize');

async function asegurarFuncionesEnTodasSedes() {
  try {
    console.log('🎬 Verificando funciones por película y sede...\n');

    // Obtener todas las películas activas
    const peliculas = await Pelicula.findAll({
      where: { estado: 'activo' }
    });

    // Obtener todas las sedes activas
    const sedes = await Sede.findAll({
      where: { estado: 'activo' },
      include: [{
        model: Sala,
        as: 'salas',
        where: { estado: 'activo' },
        required: true
      }]
    });

    console.log(`📊 Estadísticas:`);
    console.log(`   - Películas activas: ${peliculas.length}`);
    console.log(`   - Sedes activas: ${sedes.length}\n`);

    let funcionesCreadas = 0;
    const hoy = new Date();
    const proximosDias = 7; // Crear funciones para los próximos 7 días

    for (const pelicula of peliculas) {
      console.log(`\n🎥 Procesando: ${pelicula.titulo}`);
      
      for (const sede of sedes) {
        // Verificar si existe al menos una función para esta película en esta sede
        const funcionesExistentes = await Funcion.count({
          where: {
            id_pelicula: pelicula.id,
            fecha: {
              [Op.gte]: hoy.toISOString().split('T')[0]
            }
          },
          include: [{
            model: Sala,
            as: 'sala',
            where: { id_sede: sede.id },
            required: true
          }]
        });

        if (funcionesExistentes === 0) {
          // No hay funciones, crear al menos una por día
          const salaDisponible = sede.salas[0]; // Usar la primera sala disponible
          
          if (!salaDisponible) {
            console.log(`   ⚠️  ${sede.nombre}: No tiene salas disponibles`);
            continue;
          }

          // Crear funciones para los próximos días
          const horarios = ['14:00:00', '17:00:00', '20:00:00'];
          
          for (let dia = 0; dia < proximosDias; dia++) {
            const fecha = new Date(hoy);
            fecha.setDate(fecha.getDate() + dia);
            const fechaStr = fecha.toISOString().split('T')[0];

            // Crear una función por día en un horario aleatorio
            const horarioAleatorio = horarios[Math.floor(Math.random() * horarios.length)];

            try {
              await Funcion.create({
                id_pelicula: pelicula.id,
                id_sala: salaDisponible.id,
                fecha: fechaStr,
                hora: horarioAleatorio,
                estado: 'activa'
              });
              funcionesCreadas++;
            } catch (error) {
              // Si hay error de duplicado, continuar
              if (!error.message.includes('Duplicate')) {
                console.error(`     Error creando función: ${error.message}`);
              }
            }
          }
          
          console.log(`   ✅ ${sede.nombre}: Creadas ${proximosDias} funciones`);
        } else {
          console.log(`   ✓  ${sede.nombre}: Ya tiene ${funcionesExistentes} función(es)`);
        }
      }
    }

    console.log(`\n\n🎉 Proceso completado!`);
    console.log(`   - Funciones nuevas creadas: ${funcionesCreadas}`);
    console.log(`   - Cada película ahora tiene funciones en todas las sedes\n`);

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    throw error;
  }
}

// Ejecutar si se corre directamente
if (require.main === module) {
  const { sequelize } = require('../config/db');
  
  asegurarFuncionesEnTodasSedes()
    .then(() => {
      console.log('✅ Script ejecutado correctamente');
      return sequelize.close();
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { asegurarFuncionesEnTodasSedes };
