const { Sede } = require('./models');

async function testSedes() {
  try {
    const sedes = await Sede.findAll();
    console.log('✅ Total sedes:', sedes.length);
    sedes.forEach(s => {
      console.log(`- ${s.nombre} (${s.ciudad})`);
    });
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSedes();
