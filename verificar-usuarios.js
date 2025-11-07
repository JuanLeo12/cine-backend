process.env.DATABASE_URL = "postgresql://postgres:DBZrIdESMKsKHHEIKbEpIILwtYGwqlsJ@switchback.proxy.rlwy.net:56790/railway";

const { Usuario } = require('./models');

async function verificarUsuarios() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');
    
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'email', 'nombre', 'rol', 'estado'],
      order: [['id', 'ASC']]
    });

    console.log(`📊 Total de usuarios: ${usuarios.length}\n`);
    
    if (usuarios.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos');
    } else {
      console.log('👥 Lista de usuarios:');
      console.log('='.repeat(80));
      usuarios.forEach(u => {
        console.log(`ID: ${u.id.toString().padEnd(4)} | Email: ${u.email.padEnd(30)} | Nombre: ${u.nombre.padEnd(20)} | Rol: ${u.rol.padEnd(15)} | Estado: ${u.estado}`);
      });
      console.log('='.repeat(80));
      
      // Contar por rol
      const porRol = usuarios.reduce((acc, u) => {
        acc[u.rol] = (acc[u.rol] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 Usuarios por rol:');
      Object.entries(porRol).forEach(([rol, count]) => {
        console.log(`  ${rol}: ${count}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarUsuarios();
