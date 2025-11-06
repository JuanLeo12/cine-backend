/**
 * 🔧 SCRIPT: Resetear contraseña del administrador
 * 
 * Resetea la contraseña del usuario admin@cinestar.com a: Admin123
 * 
 * Uso: node scripts/resetear-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

async function resetearAdmin() {
  try {
    console.log('� Buscando usuario admin...\n');
    
    const admin = await Usuario.findOne({ 
      where: { email: 'admin@cinestar.com' } 
    });
    
    if (!admin) {
      console.log('❌ Usuario admin@cinestar.com no encontrado en la base de datos');
      process.exit(1);
    }
    
    console.log(`✅ Usuario encontrado: ${admin.email}`);
    console.log(`   Nombre: ${admin.nombre} ${admin.apellido}`);
    console.log(`   Rol: ${admin.rol}\n`);
    
    // Nueva contraseña
    const nuevaPassword = 'Admin123';
    
    console.log('🔐 Generando nueva contraseña...');
    const hash = await bcrypt.hash(nuevaPassword, 10);
    
    console.log('💾 Actualizando en base de datos...');
    await admin.update({ 
      password: hash,
      token_sesion: null 
    });
    
    console.log('\n✅ ¡Contraseña reseteada exitosamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@cinestar.com');
    console.log('🔑 Password: Admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error.message);
    process.exit(1);
  }
}

resetearAdmin();
