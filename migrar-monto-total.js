/**
 * Migración: Agregar columna monto_total a ordenes_compra
 */

const { sequelize } = require('./models');

async function agregarMontoTotal() {
  try {
    console.log('🔧 Verificando si la columna monto_total existe...');

    // Verificar si la columna existe
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ordenes_compra' 
      AND column_name = 'monto_total';
    `);

    if (columns.length > 0) {
      console.log('✅ La columna monto_total ya existe');
      process.exit(0);
      return;
    }

    console.log('➕ Agregando columna monto_total...');

    // Agregar columna
    await sequelize.query(`
      ALTER TABLE ordenes_compra 
      ADD COLUMN monto_total DECIMAL(10, 2) DEFAULT 0.00;
    `);

    console.log('✅ Columna monto_total agregada exitosamente');

    // Actualizar órdenes existentes calculando el monto desde pagos
    console.log('🔄 Actualizando montos de órdenes existentes...');
    
    await sequelize.query(`
      UPDATE ordenes_compra oc
      SET monto_total = COALESCE((
        SELECT p.monto_total 
        FROM pagos p 
        WHERE p.id_orden_compra = oc.id 
        LIMIT 1
      ), 0.00)
      WHERE oc.monto_total IS NULL OR oc.monto_total = 0;
    `);

    const [result] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM ordenes_compra 
      WHERE monto_total > 0;
    `);

    console.log(`✅ ${result[0].count} órdenes actualizadas con sus montos`);
    console.log('🎉 Migración completada exitosamente');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

agregarMontoTotal();
