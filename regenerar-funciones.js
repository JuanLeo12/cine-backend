const { Funcion, Sala, Pelicula } = require('./models');

async function regenerarFunciones() {
  try {
    console.log('🔄 Regenerando funciones para nuevas salas...\n');

    // Obtener todas las películas en cartelera
    const peliculas = await Pelicula.findAll({
      where: { tipo: 'cartelera' }
    });

    if (peliculas.length === 0) {
      console.log('⚠️  No hay películas en cartelera');
      process.exit(0);
    }

    // Obtener todas las salas activas
    const salas = await Sala.findAll({
      where: { estado: 'activa' }
    });

    console.log(`📽️  Películas en cartelera: ${peliculas.length}`);
    console.log(`🏢 Salas disponibles: ${salas.length}\n`);

    // Eliminar funciones antiguas
    await Funcion.destroy({ where: {} });
    console.log('✅ Funciones antiguas eliminadas\n');

    const hoy = new Date();
    const horarios = ['11:00:00', '14:00:00', '17:00:00', '19:30:00', '22:00:00'];
    let funcionesCreadas = 0;

    // Crear funciones para los próximos 7 días
    for (let dia = 0; dia < 7; dia++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + dia);
      const fechaStr = fecha.toISOString().split('T')[0];

      // Para cada película, crear funciones en algunas salas aleatorias
      for (const pelicula of peliculas) {
        // Seleccionar 6-8 salas aleatorias para esta película
        const numSalas = 6 + Math.floor(Math.random() * 3); // 6-8 salas
        const salasAleatorias = salas
          .sort(() => Math.random() - 0.5)
          .slice(0, numSalas);

        for (const sala of salasAleatorias) {
          // 2-3 funciones por sala por día
          const numFunciones = 2 + Math.floor(Math.random() * 2);
          const horariosSeleccionados = horarios
            .sort(() => Math.random() - 0.5)
            .slice(0, numFunciones);

          for (const hora of horariosSeleccionados) {
            try {
              await Funcion.create({
                id_pelicula: pelicula.id,
                id_sala: sala.id,
                fecha: fechaStr,
                hora: hora,
                estado: 'activa',
                es_privada: false
              });
              funcionesCreadas++;
            } catch (error) {
              // Ignorar errores de funciones duplicadas
              if (!error.message.includes('unique')) {
                console.error(`Error creando función: ${error.message}`);
              }
            }
          }
        }
      }
    }

    console.log(`\n✅ ${funcionesCreadas} funciones creadas exitosamente`);
    console.log(`📅 Funciones distribuidas en 7 días`);
    console.log(`🎬 Para ${peliculas.length} películas`);
    console.log(`🏢 En ${salas.length} salas\n`);

    // Verificar funciones por película
    console.log('Funciones por película:');
    for (const pelicula of peliculas.slice(0, 5)) {
      const count = await Funcion.count({
        where: { id_pelicula: pelicula.id }
      });
      console.log(`- ${pelicula.titulo}: ${count} funciones`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

regenerarFunciones();
