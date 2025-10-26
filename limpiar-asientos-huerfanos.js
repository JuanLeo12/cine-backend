/**
 * Script para limpiar asientos "ocupados" sin tickets válidos (huérfanos)
 * Esto sucede cuando confirmarOrden() falla DESPUÉS de marcar asientos como ocupados
 * pero ANTES de crear los tickets
 */

const { AsientoFuncion, Ticket, sequelize } = require('./models');

async function limpiarAsientosHuerfanos() {
  try {
    console.log('🔍 Buscando asientos ocupados sin tickets válidos...');

    // Obtener todos los asientos ocupados
    const asientosOcupados = await AsientoFuncion.findAll({
      where: { estado: 'ocupado' },
      attributes: ['id', 'id_funcion', 'fila', 'numero', 'id_usuario_bloqueo']
    });

    console.log(`📊 Total de asientos ocupados: ${asientosOcupados.length}`);

    let huerfanos = 0;
    let validos = 0;

    for (const asiento of asientosOcupados) {
      // Buscar si existe un ticket para este asiento
      const ticket = await Ticket.findOne({
        where: { id_asiento: asiento.id }
      });

      if (!ticket) {
        console.log(`❌ Asiento huérfano encontrado: ${asiento.fila}${asiento.numero} (id: ${asiento.id}) - Función ${asiento.id_funcion}`);
        
        // Eliminar el registro (liberar el asiento)
        await asiento.destroy();
        console.log(`   ✅ Asiento liberado`);
        huerfanos++;
      } else {
        validos++;
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Asientos válidos (con ticket): ${validos}`);
    console.log(`   ❌ Asientos huérfanos limpiados: ${huerfanos}`);
    console.log(`\n🎉 Limpieza completada`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    process.exit(1);
  }
}

// Ejecutar
limpiarAsientosHuerfanos();
