const { Sede, Sala } = require('./models');

async function testSedesAPI() {
  try {
    const sedes = await Sede.findAll({
      where: { estado: "activo" },
      attributes: ["id", "nombre", "direccion", "ciudad"],
      order: [["nombre", "ASC"]],
      include: [
        { model: Sala, as: "salas", attributes: ["id", "nombre"], required: false }
      ],
    });
    
    console.log('✅ Sedes encontradas:', sedes.length);
    console.log('\nPrimeras 5 sedes:');
    sedes.slice(0, 5).forEach(s => {
      console.log(`- ${s.nombre} (${s.ciudad}) - ${s.salas.length} salas`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSedesAPI();
