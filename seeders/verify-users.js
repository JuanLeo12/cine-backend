const { Usuario } = require("../models");

(async () => {
  try {
    const users = await Usuario.findAll({
      order: [['rol', 'ASC'], ['nombre', 'ASC']],
      attributes: ['nombre', 'email', 'telefono', 'rol', 'ruc', 'representante', 'cargo']
    });

    console.log('\n=== USUARIOS DEL SISTEMA ===\n');
    
    console.log('🔐 ADMINISTRADOR:');
    users.filter(u => u.rol === 'admin').forEach(u => {
      console.log(`  Email: ${u.email}`);
      console.log(`  Nombre: ${u.nombre}`);
      console.log(`  Teléfono: ${u.telefono}`);
      console.log('');
    });

    console.log('👤 CLIENTES:');
    users.filter(u => u.rol === 'cliente').forEach(u => {
      console.log(`  Email: ${u.email}`);
      console.log(`  Nombre: ${u.nombre}`);
      console.log(`  Teléfono: ${u.telefono}`);
      console.log('');
    });

    console.log('🏢 CORPORATIVOS:');
    users.filter(u => u.rol === 'corporativo').forEach(u => {
      console.log(`  Email: ${u.email}`);
      console.log(`  Empresa: ${u.nombre}`);
      console.log(`  Teléfono: ${u.telefono}`);
      console.log(`  RUC: ${u.ruc}`);
      console.log(`  Representante: ${u.representante}`);
      console.log(`  Cargo: ${u.cargo}`);
      console.log('');
    });

    console.log(`Total usuarios: ${users.length}\n`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
