process.env.DATABASE_URL = "postgresql://postgres:DBZrIdESMKsKHHEIKbEpIILwtYGwqlsJ@switchback.proxy.rlwy.net:56790/railway";

const { Usuario } = require('./models');
const bcrypt = require('bcrypt');

async function verificarPassword() {
  try {
    const usuarios = await Usuario.findAll({
      where: {
        email: ['juanleotak@gmail.com', 'juan@gmail.com']
      },
      attributes: ['id', 'email', 'nombre', 'password']
    });

    console.log('\n🔍 Verificando usuarios:\n');
    
    for (const usuario of usuarios) {
      console.log(`\n📧 ${usuario.email}`);
      console.log(`👤 ${usuario.nombre}`);
      console.log(`🔑 Hash: ${usuario.password.substring(0, 30)}...`);
      
      // Verificar si el hash es válido
      const esHashValido = usuario.password.startsWith('$2a$') || usuario.password.startsWith('$2b$');
      console.log(`✓ Hash válido: ${esHashValido ? 'Sí' : 'No'}`);
      
      // Probar con cliente12345
      try {
        const coincide = await bcrypt.compare('cliente12345', usuario.password);
        console.log(`✓ Password 'cliente12345': ${coincide ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
      } catch (err) {
        console.log(`✓ Password 'cliente12345': ❌ ERROR: ${err.message}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarPassword();
