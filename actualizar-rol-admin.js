process.env.DATABASE_URL = "postgresql://postgres:DBZrIdESMKsKHHEIKbEpIILwtYGwqlsJ@switchback.proxy.rlwy.net:56790/railway";

const { Usuario } = require('./models');

async function actualizarRol() {
  try {
    console.log('🔄 Actualizando rol de administradores...');
    
    const result = await Usuario.update(
      { rol: 'admin' },
      { where: { rol: 'administrador' } }
    );

    console.log(`✅ Se actualizaron ${result[0]} usuarios de 'administrador' a 'admin'`);
    
    // Verificar
    const admins = await Usuario.findAll({ 
      where: { rol: 'admin' },
      attributes: ['id', 'email', 'nombre', 'rol']
    });
    
    console.log('\n👥 Administradores actualizados:');
    admins.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.nombre}) - Rol: ${admin.rol}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarRol();
