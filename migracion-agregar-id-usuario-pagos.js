/**
 * 🔧 Migración: Agregar columna id_usuario a tabla pagos
 * 
 * ¿Por qué?
 * - Los vales corporativos se crean con pagos directos (sin orden)
 * - Necesitamos rastrear qué usuario hizo el pago
 * - Esto permite obtener "Mis Compras" correctamente para vales sin orden
 */

const sequelize = require('./config/db');
const { Pago, OrdenCompra } = require('./models');

async function migrar() {
  try {
    console.log('🚀 Iniciando migración: Agregar id_usuario a pagos...\n');

    // 1. Agregar columna id_usuario (permitir NULL inicialmente)
    await sequelize.query(`
      ALTER TABLE pagos 
      ADD COLUMN IF NOT EXISTS id_usuario INTEGER REFERENCES usuarios(id);
    `);
    console.log('✅ Columna id_usuario agregada a tabla pagos');

    // 2. Poblar id_usuario para pagos existentes que tienen orden
    const [results] = await sequelize.query(`
      UPDATE pagos 
      SET id_usuario = ordenes_compra.id_usuario
      FROM ordenes_compra
      WHERE pagos.id_orden_compra = ordenes_compra.id
        AND pagos.id_usuario IS NULL;
    `);
    console.log(`✅ ${results.rowCount || 0} pagos actualizados con id_usuario de su orden`);

    // 3. Verificar pagos sin id_usuario (estos son problemáticos)
    const pagosSinUsuario = await Pago.count({
      where: { id_usuario: null }
    });
    
    if (pagosSinUsuario > 0) {
      console.log(`⚠️  ${pagosSinUsuario} pagos sin id_usuario (probablemente pagos directos huérfanos)`);
      console.log('   Estos pagos deben asignarse manualmente o eliminarse si son de prueba.');
    }

    console.log('\n✅ Migración completada exitosamente');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Actualizar modelo Pago.js para incluir id_usuario');
    console.log('   2. Actualizar pagosController para guardar req.user.id al crear pago');
    console.log('   3. Los nuevos pagos directos ahora tendrán id_usuario correctamente');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrar();
