process.env.DATABASE_URL = "postgresql://postgres:DBZrIdESMKsKHHEIKbEpIILwtYGwqlsJ@switchback.proxy.rlwy.net:56790/railway";

const { Usuario } = require('./models');

async function resetearPasswordsClientes() {
  try {
    console.log('🔄 Actualizando contraseñas de usuarios clientes...\n');
    
    // Obtener todos los clientes y corporativos
    const usuarios = await Usuario.findAll({
      where: {
        rol: ['cliente', 'corporativo']
      }
    });

    console.log(`📊 Encontrados ${usuarios.length} usuarios\n`);

    for (const usuario of usuarios) {
      // Actualizar con la contraseña en texto plano
      // El hook beforeUpdate lo hasheará correctamente
      await usuario.update({
        password: 'cliente12345'
      });
      
      console.log(`✅ ${usuario.email.padEnd(35)} - Password actualizado a 'cliente12345'`);
    }

    console.log('\n✅ Todas las contraseñas han sido actualizadas');
    console.log('\n📝 Credenciales de prueba:');
    console.log('   Email: Cualquiera de los usuarios');
    console.log('   Password: cliente12345');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetearPasswordsClientes();
