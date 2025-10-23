const { Funcion, Sala, Sede, Pelicula } = require('./models');

async function testFunciones() {
  try {
    const funciones = await Funcion.findAll({
      where: { 
        id_pelicula: 11, 
        estado: 'activa' 
      },
      include: [
        {
          model: Sala,
          as: 'sala',
          include: [{ model: Sede, as: 'sede' }]
        },
        {
          model: Pelicula,
          as: 'pelicula'
        }
      ],
      order: [['fecha', 'ASC'], ['hora', 'ASC']],
      limit: 2
    });

    console.log(`✅ Funciones encontradas: ${funciones.length}`);
    
    if (funciones[0]) {
      const f = funciones[0];
      console.log(`Película: ${f.pelicula.titulo}`);
      console.log(`Sala: ${f.sala.nombre}`);
      console.log(`Sede: ${f.sala.sede.nombre}`);
      console.log(`Fecha: ${f.fecha}`);
      console.log(`Hora: ${f.hora}`);
      console.log('\n✅ TODAS LAS ASOCIACIONES FUNCIONAN CORRECTAMENTE');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testFunciones();
