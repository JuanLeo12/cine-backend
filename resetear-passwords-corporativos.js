process.env.DATABASE_URL = "postgresql://postgres:DBZrIdESMKsKHHEIKbEpIILwtYGwqlsJ@switchback.proxy.rlwy.net:56790/railway";

const { Usuario } = require('./models');

async function resetearPasswordsCorporativos() {
  try {
    console.log('🔄 Actualizando contraseñas de usuarios corporativos...\n');
    
    // Obtener solo los corporativos
    const corporativos = await Usuario.findAll({
      where: {
        rol: 'corporativo'
      }
    });

    console.log(`📊 Encontrados ${corporativos.length} usuarios corporativos\n`);

    for (const usuario of corporativos) {
      // Actualizar con la contraseña en texto plano
      // El hook beforeUpdate lo hasheará correctamente
      await usuario.update({
        password: 'corporativo123'
      });
      
      console.log(`✅ ${usuario.email.padEnd(35)} - Password actualizado a 'corporativo123'`);
    }

    console.log('\n✅ Todas las contraseñas corporativas han sido actualizadas');
    console.log('\n📝 Credenciales:');
    console.log('   🏢 Corporativos: corporativo123');
    console.log('   👤 Clientes: cliente12345');
    console.log('   👨‍💼 Admin: admin12345');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetearPasswordsCorporativos();
