const { Pelicula } = require('./models');

async function verificarPeliculas() {
  try {
    const peliculas = await Pelicula.findAll();
    console.log(`\nTotal películas: ${peliculas.length}\n`);
    
    peliculas.forEach(p => {
      console.log(`- ID: ${p.id}, Título: ${p.titulo}, Tipo: ${p.tipo}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verificarPeliculas();
