process.env.DATABASE_URL = "postgresql://postgres:DBZrIdESMKsKHHEIKbEpIILwtYGwqlsJ@switchback.proxy.rlwy.net:56790/railway";

const { Usuario } = require('./models');
const bcrypt = require('bcrypt'); // Usar bcrypt, no bcryptjs

async function crearAdmin() {
  try {
    console.log('🔍 Buscando usuario admin existente...');
    
    let admin = await Usuario.findOne({ 
      where: { email: 'admin@cinestar.com' } 
    });

    if (admin) {
      console.log('✅ Usuario admin encontrado, actualizando contraseña...');
      // No hasheamos aquí, el beforeUpdate hook del modelo lo hará
      await admin.update({ 
        password: 'admin12345',
        rol: 'administrador'
      });
      console.log('✅ Contraseña actualizada correctamente');
      console.log(`📝 Se mantuvo: Nombre: ${admin.nombre}, DNI: ${admin.dni}, Teléfono: ${admin.telefono}`);
    } else {
      console.log('➕ Creando nuevo usuario admin...');
      // No hasheamos aquí, el beforeCreate hook del modelo lo hará
      admin = await Usuario.create({
        nombre: 'Administrador',
        email: 'admin@cinestar.com',
        password: 'admin12345',
        rol: 'administrador',
        telefono: '999999999',
        dni: '00000000'
      });
      console.log('✅ Usuario admin creado correctamente');
    }

    console.log('\n📧 Email: admin@cinestar.com');
    console.log('🔑 Password: admin12345');
    console.log('👤 Rol: administrador');
    console.log('\n✅ Ahora puedes iniciar sesión en el frontend');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearAdmin();
