/**
 * 🚀 Script para inicializar la base de datos en Supabase
 * 
 * Este script:
 * 1. Se conecta a Supabase usando las credenciales del .env
 * 2. Crea todas las tablas según los modelos de Sequelize
 * 3. Establece las relaciones entre tablas
 * 
 * ⚠️ EJECUTAR SOLO UNA VEZ para crear la estructura inicial
 */

require('dotenv').config();
const sequelize = require('./config/db');
const db = require('./models');

async function inicializarBaseDatos() {
  try {
    console.log('🔌 Conectando a Supabase...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');

    console.log('📊 Base de datos:', process.env.DB_NAME);
    console.log('🏠 Host:', process.env.DB_HOST);

    console.log('\n📦 Creando tablas desde modelos Sequelize...');
    
    // sync({ alter: false, force: false }) 
    // - No modificará tablas existentes
    // - No eliminará datos
    // - Solo creará tablas que no existan
    await sequelize.sync({ alter: false, force: false });
    
    console.log('✅ ¡Tablas creadas exitosamente!');
    
    // Mostrar todas las tablas creadas
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Tablas en la base de datos:');
    results.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
    console.log('\n🎉 ¡Base de datos inicializada correctamente en Supabase!');
    console.log('💡 Ahora puedes desplegar tu backend en Railway');
    
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error);
    console.error('\n💡 Verifica:');
    console.error('   - Que las credenciales en .env sean correctas');
    console.error('   - Que la base de datos en Supabase esté activa');
    console.error('   - Que tengas conexión a internet');
  } finally {
    await sequelize.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

inicializarBaseDatos();
