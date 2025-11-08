/**
 * Migración: Permitir id_orden_compra NULL en tabla pagos
 * 
 * Esto es necesario para pagos directos sin orden de compra,
 * como los vales corporativos que se pagan directamente.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la base de datos
const sequelize = new Sequelize(
  process.env.DATABASE_URL || {
    database: process.env.DB_NAME || 'cine_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function migrar() {
  try {
    console.log('🔄 Conectando a la base de datos...');
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
      console.log('✅ ¡Migración completada exitosamente!');
      console.log('   La columna id_orden_compra ahora permite valores NULL');
    } else {
      console.log('⚠️ La migración se ejecutó pero la verificación falló');
    }

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    console.error('Detalles:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar migración
migrar();
