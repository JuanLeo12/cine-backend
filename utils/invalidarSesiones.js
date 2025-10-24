// Script para incrementar token_version de todos los usuarios al iniciar el servidor
const { Usuario } = require('../models');

async function invalidarTodasLasSesiones() {
  try {
    console.log('🔒 Invalidando todas las sesiones activas...');
    
    const result = await Usuario.update(
      { token_version: Usuario.sequelize.literal('token_version + 1') },
      { where: {} }
    );
    
    console.log(`✅ ${result[0]} usuarios actualizados - Todas las sesiones han sido invalidadas`);
    console.log('   Los usuarios deberán iniciar sesión nuevamente');
    
    return result;
  } catch (error) {
    console.error('❌ Error invalidando sesiones:', error);
    throw error;
  }
}

module.exports = { invalidarTodasLasSesiones };
