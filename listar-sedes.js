const { Sede } = require('./models');

async function listarSedes() {
  try {
    const sedes = await Sede.findAll({ order: [['nombre', 'ASC']] });
    console.log('SEDES EN BASE DE DATOS:');
    console.log('='.repeat(60));
    sedes.forEach(sede => {
      console.log(`\n${sede.nombre}`);
      console.log(`  Dirección: ${sede.direccion}`);
      console.log(`  Ciudad: ${sede.ciudad}`);
      console.log(`  Estado: ${sede.estado}`);
    });
    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${sedes.length} sedes`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listarSedes();
