/**
 * Migración Railway: Permitir id_orden_compra NULL en tabla pagos
 * 
 * Ejecutar en Railway con:
 * railway run node migracion-pago-nullable-railway.js
 * 
 * O manualmente en Railway Dashboard > Database > Query:
 * ALTER TABLE pagos ALTER COLUMN id_orden_compra DROP NOT NULL;
 */

const { Sequelize } = require('sequelize');

// Usar DATABASE_URL de Railway
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está configurada');
  console.log('💡 Ejecuta este script con: railway run node migracion-pago-nullable-railway.js');
  process.exit(1);
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log
});

async function migrar() {
  try {
    console.log('🔄 Conectando a la base de datos de Railway...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');

    console.log('🔧 Modificando columna id_orden_compra en tabla pagos...');
    
    // Modificar la columna para permitir NULL
    await sequelize.query(`
      ALTER TABLE pagos 
      ALTER COLUMN id_orden_compra DROP NOT NULL;
    `);

    console.log('✅ Columna id_orden_compra ahora permite valores NULL');
    console.log('📊 Verificando cambio...');

    // Verificar el cambio
    const [results] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'pagos' AND column_name = 'id_orden_compra';
    `);

    console.log('Resultado:', results[0]);

    if (results[0]?.is_nullable === 'YES') {
      console.log('✅ ¡Migración completada exitosamente en Railway!');
      console.log('   La columna id_orden_compra ahora permite valores NULL');
    } else {
      console.log('⚠️ La migración se ejecutó pero la verificación falló');
    }

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    console.error('Detalles:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar migración
migrar();
