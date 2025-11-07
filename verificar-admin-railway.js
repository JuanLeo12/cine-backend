process.env.DATABASE_URL = "postgresql://postgres:DBZrIdESMKsKHHEIKbEpIILwtYGwqlsJ@switchback.proxy.rlwy.net:56790/railway";

const { Usuario } = require('./models');
const bcrypt = require('bcryptjs');

async function verificarAdmin() {
  try {
    const admins = await Usuario.findAll({ 
      where: { rol: 'administrador' },
      attributes: ['id', 'email', 'nombre', 'password']
    });

    console.log('\n👤 Usuarios administradores en Railway:\n');
    
    for (const admin of admins) {
      console.log(`ID: ${admin.id}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Nombre: ${admin.nombre}`);
      console.log(`Password hash: ${admin.password.substring(0, 20)}...`);
      
      // Verificar si el hash es válido
      const esHashValido = admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$');
      console.log(`¿Hash bcrypt válido?: ${esHashValido ? '✅' : '❌'}`);
      console.log('---');
    }

    console.log('\n💡 Probando contraseña "admin12345":');
    const testPassword = 'admin12345';
    
    for (const admin of admins) {
      const coincide = await bcrypt.compare(testPassword, admin.password);
      console.log(`${admin.email}: ${coincide ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarAdmin();
