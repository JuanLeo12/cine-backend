const { Funcion, Pelicula, Sala, Sede } = require('./models');

async function testFunciones() {
  try {
    // Probar funciones para Oppenheimer (ID: 11)
    const funciones = await Funcion.findAll({
      where: { id_pelicula: 11 },
      include: [
        {
          model: Sala,
          as: 'sala',
          include: [{ model: Sede, as: 'sede' }]
        },
        { model: Pelicula, as: 'pelicula' }
      ],
      limit: 10
    });

    console.log(`\n✅ Funciones encontradas para Oppenheimer: ${funciones.length}\n`);
    
    funciones.forEach((func, index) => {
      console.log(`${index + 1}. ${func.fecha} ${func.hora}`);
      console.log(`   Sala: ${func.sala?.nombre || 'N/A'}`);
      console.log(`   Sede: ${func.sala?.sede?.nombre || 'N/A'}`);
      console.log(`   Ciudad: ${func.sala?.sede?.ciudad || 'N/A'}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testFunciones();
