const bcrypt = require("bcryptjs");
const {
  Usuario,
  Pelicula,
  Sede,
  Sala,
  Funcion,
  Combo,
  MetodoPago,
  TipoTicket,
  AsientoFuncion,
  OrdenCompra,
  OrdenTicket,
  OrdenCombo,
  Pago,
  Ticket,
  sequelize,
} = require("../models");

const seedDatabase = async () => {
  try {
    console.log("🌱 Iniciando seed de la base de datos...\n");

    // Sincronizar base de datos (alter: true mantiene datos existentes)
    await sequelize.sync({ alter: true });
    console.log("✅ Base de datos sincronizada\n");

    // Verificar si ya hay datos
    const usuariosCount = await Usuario.count();
    if (usuariosCount > 0) {
      console.log("⚠️  La base de datos ya contiene datos.");
      console.log("💡 Si deseas limpiar y reinsertar datos, elimina manualmente o usa otro script.\n");
      console.log("📊 Datos actuales:");
      console.log(`   - ${usuariosCount} usuarios`);
      console.log(`   - ${await Pelicula.count()} películas`);
      console.log(`   - ${await Sede.count()} sedes`);
      console.log(`   - ${await Funcion.count()} funciones`);
      console.log(`   - ${await Combo.count()} combos\n`);
      process.exit(0);
    }

    console.log("💡 Base de datos vacía. Insertando datos iniciales...\n");

    // 1. USUARIOS
    console.log("👥 Creando usuarios...");
    const hashedPassword = await bcrypt.hash("123456", 10);

    const usuarios = await Usuario.bulkCreate([
      // Admin
      {
        nombre: "Administrador CineStar",
        email: "admin@cinestar.com",
        password: hashedPassword,
        rol: "admin",
        telefono: "6259090",
        estado: "activo",
      },
      // Clientes regulares
      {
        nombre: "Juan Pérez",
        email: "juan@gmail.com",
        password: hashedPassword,
        telefono: "987654321",
        rol: "cliente",
        estado: "activo",
      },
      {
        nombre: "María García",
        email: "maria@gmail.com",
        password: hashedPassword,
        telefono: "965432178",
        rol: "cliente",
        estado: "activo",
      },
      {
        nombre: "Carlos Rodriguez",
        email: "carlos@hotmail.com",
        password: hashedPassword,
        telefono: "943217865",
        rol: "cliente",
        estado: "activo",
      },
      {
        nombre: "Ana Torres",
        email: "ana.torres@gmail.com",
        password: hashedPassword,
        telefono: "912345678",
        rol: "cliente",
        estado: "activo",
      },
      {
        nombre: "Luis Martínez",
        email: "luis.martinez@outlook.com",
        password: hashedPassword,
        telefono: "998877665",
        rol: "cliente",
        estado: "activo",
      },
      // Clientes corporativos
      {
        nombre: "Banco de Crédito del Perú",
        email: "corporativo@bcp.com.pe",
        password: hashedPassword,
        telefono: "6119898",
        rol: "corporativo",
        estado: "activo",
        ruc: "20100047218",
        representante: "Jorge Sánchez Díaz",
        cargo: "Gerente de Recursos Humanos",
      },
      {
        nombre: "Telefónica del Perú",
        email: "eventos@telefonica.com.pe",
        password: hashedPassword,
        telefono: "6117070",
        rol: "corporativo",
        estado: "activo",
        ruc: "20100017491",
        representante: "Patricia Mendoza León",
        cargo: "Coordinadora de Eventos Corporativos",
      },
      {
        nombre: "Backus SAA",
        email: "recursos.humanos@backus.pe",
        password: hashedPassword,
        telefono: "6113000",
        rol: "corporativo",
        estado: "activo",
        ruc: "20100053455",
        representante: "Miguel Ángel Ramírez",
        cargo: "Jefe de Bienestar Social",
      },
    ]);
    console.log(`✅ ${usuarios.length} usuarios creados\n`);

    // 2. PELÍCULAS
    console.log("🎬 Creando películas...");
    const peliculas = await Pelicula.bulkCreate([
      // CARTELERA - 12 películas
      {
        titulo: "Oppenheimer",
        genero: "Drama Histórico",
        clasificacion: "R",
        duracion: 180,
        fecha_estreno: "2024-07-20",
        sinopsis:
          "La historia de J. Robert Oppenheimer y el desarrollo de la bomba atómica durante la Segunda Guerra Mundial.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        tipo: "cartelera",
        estado: "activa",
      },
      {
        titulo: "Barbie",
        genero: "Comedia",
        clasificacion: "PG-13",
        duracion: 114,
        fecha_estreno: "2024-07-20",
        sinopsis:
          "Barbie vive en Barbieland y decide aventurarse en el mundo real, descubriendo lo que significa ser humano.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
        tipo: "cartelera",
        estado: "activa",
      },
      {
        titulo: "Dune: Parte Dos",
        genero: "Ciencia Ficción",
        clasificacion: "PG-13",
        duracion: 166,
        fecha_estreno: "2024-03-01",
        sinopsis:
          "Paul Atreides se une a Chani y los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        tipo: "cartelera",
        estado: "activa",
      },
      {
        titulo: "Kung Fu Panda 4",
        genero: "Animación",
        clasificacion: "PG",
        duracion: 94,
        fecha_estreno: "2024-03-08",
        sinopsis:
          "Po debe entrenar a un nuevo Guerrero Dragón mientras enfrenta a un nuevo villano que puede invocar a todos sus enemigos del pasado.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
        tipo: "cartelera",
        estado: "activa",
      },
      {
        titulo: "Godzilla y Kong: El Nuevo Imperio",
        genero: "Acción",
        clasificacion: "PG-13",
        duracion: 115,
        fecha_estreno: "2024-03-29",
        sinopsis:
          "Los dos titanes más poderosos de la Tierra enfrentan una amenaza colosal oculta dentro del mundo y desafían su propia existencia.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg",
        tipo: "cartelera",
        estado: "activa",
      },
      {
        titulo: "Intensamente 2",
        genero: "Animación",
        clasificacion: "PG",
        duracion: 96,
        fecha_estreno: "2024-06-14",
        sinopsis:
          "Riley entra en la adolescencia y nuevas emociones como Ansiedad, Envidia y Vergüenza llegan al cuartel general de su mente.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
        tipo: "cartelera",
        estado: "activa",
      },
      {
        titulo: "Los Juegos del Hambre: Balada de Pájaros Cantores y Serpientes",
        genero: "Acción/Drama",
        clasificacion: "PG-13",
        duracion: 157,
        fecha_estreno: "2023-11-17",
        sinopsis:
          "La historia de origen del joven Coriolanus Snow antes de convertirse en el tiránico presidente de Panem.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg",
        tipo: "cartelera",
        estado: "activa",
      },
      {
        titulo: "Wonka",
        genero: "Musical/Fantasía",
        clasificacion: "PG",
        duracion: 116,
        fecha_estreno: "2023-12-15",
        sinopsis:
          "La historia de cómo el joven Willy Wonka se convirtió en el chocolatero más famoso del mundo.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg",
        tipo: "cartelera",
        estado: "activa",
      },
      {
        titulo: "Migration",
        genero: "Animación/Comedia",
        clasificacion: "PG",
        duracion: 83,
        fecha_estreno: "2023-12-22",
        sinopsis:
          "Una familia de patos intenta convencer a su sobreprotector padre de irse de vacaciones de su vida en un estanque de Nueva Inglaterra.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/ldfCF9RhR40mppkzmftxapaHeTo.jpg",
        tipo: "cartelera",
        estado: "activa",
      },
      {
        titulo: "Aquaman y el Reino Perdido",
        genero: "Acción/Aventura",
        clasificacion: "PG-13",
        duracion: 124,
        fecha_estreno: "2023-12-22",
        sinopsis:
          "Black Manta busca venganza contra Aquaman por la muerte de su padre. Aquaman debe forjar una alianza con su hermano encarcelado para defender Atlantis.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/7lTnXOy0iNtBAdRP3TZvaKJ77F6.jpg",
        tipo: "cartelera",
        estado: "activa",
      },
      {
        titulo: "La Sociedad de la Nieve",
        genero: "Drama/Supervivencia",
        clasificacion: "R",
        duracion: 144,
        fecha_estreno: "2023-12-15",
        sinopsis:
          "La increíble historia del equipo de rugby uruguayo cuyo avión se estrelló en los Andes en 1972 y cómo sobrevivieron durante 72 días.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/2e853FDVSIso600RqAMunPxiZjq.jpg",
        tipo: "cartelera",
        estado: "activa",
      },
      {
        titulo: "Guardianes de la Galaxia Vol. 3",
        genero: "Acción/Comedia",
        clasificacion: "PG-13",
        duracion: 150,
        fecha_estreno: "2023-05-05",
        sinopsis:
          "Los Guardianes emprenden una misión para proteger a uno de los suyos y enfrentan el oscuro pasado de Rocket.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg",
        tipo: "cartelera",
        estado: "activa",
      },
      
      // PRÓXIMOS ESTRENOS - 8 películas
      {
        titulo: "Deadpool 3",
        genero: "Acción/Comedia",
        clasificacion: "R",
        duracion: 127,
        fecha_estreno: "2025-05-03",
        sinopsis:
          "El mercenario bocón regresa con más aventuras y humor irreverente. Esta vez, se une al Universo Cinematográfico de Marvel.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/4q2hz2m8hubgEm88JEJfJ5vINKS.jpg",
        tipo: "proxEstreno",
        estado: "activa",
      },
      {
        titulo: "Misión Imposible: Sentencia Mortal Parte 2",
        genero: "Acción/Espionaje",
        clasificacion: "PG-13",
        duracion: 140,
        fecha_estreno: "2025-05-23",
        sinopsis:
          "Ethan Hunt y su equipo del FMI enfrentan su misión más peligrosa: rastrear una nueva arma aterradora antes de que caiga en manos equivocadas.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/yF1eOkaYvwiORauRCPWznV9xVvi.jpg",
        tipo: "proxEstreno",
        estado: "activa",
      },
      {
        titulo: "Capitán América: Un Nuevo Mundo",
        genero: "Acción/Aventura",
        clasificacion: "PG-13",
        duracion: 135,
        fecha_estreno: "2025-02-14",
        sinopsis:
          "Sam Wilson, quien oficialmente asumió el manto de Capitán América, se encuentra en medio de un incidente internacional.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/5Eom3JsXgQlCkRJZKP8kbE9I7LI.jpg",
        tipo: "proxEstreno",
        estado: "activa",
      },
      {
        titulo: "Avatar 3",
        genero: "Ciencia Ficción",
        clasificacion: "PG-13",
        duracion: 180,
        fecha_estreno: "2025-12-19",
        sinopsis:
          "Jake Sully y Neytiri continúan su aventura en Pandora, explorando nuevos territorios y enfrentando nuevas amenazas.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
        tipo: "proxEstreno",
        estado: "activa",
      },
      {
        titulo: "Thunderbolts",
        genero: "Acción/Aventura",
        clasificacion: "PG-13",
        duracion: 125,
        fecha_estreno: "2025-07-25",
        sinopsis:
          "Un grupo de villanos y antiheroes son reclutados por el gobierno para realizar misiones peligrosas a cambio de indultos.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/4gKxQIW91hOTELjY5lzjMbLoGxB.jpg",
        tipo: "proxEstreno",
        estado: "activa",
      },
      {
        titulo: "Los Cuatro Fantásticos",
        genero: "Acción/Aventura",
        clasificacion: "PG-13",
        duracion: 130,
        fecha_estreno: "2025-07-25",
        sinopsis:
          "La primera familia de Marvel finalmente llega al MCU. Los científicos Reed Richards, Sue Storm, Johnny Storm y Ben Grimm obtienen superpoderes.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/6XzIUe6VJ5LkDjWe9XZnzZvzWqV.jpg",
        tipo: "proxEstreno",
        estado: "activa",
      },
      {
        titulo: "Wicked",
        genero: "Musical/Fantasía",
        clasificacion: "PG",
        duracion: 145,
        fecha_estreno: "2025-11-27",
        sinopsis:
          "La historia no contada de las brujas de Oz. Una amistad poco probable entre Elphaba y Glinda en la Universidad de Shiz.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/c5Tqxeo1UpBvnAc3csUm7j3hlQl.jpg",
        tipo: "proxEstreno",
        estado: "activa",
      },
      {
        titulo: "Superman: Legacy",
        genero: "Acción/Aventura",
        clasificacion: "PG-13",
        duracion: 140,
        fecha_estreno: "2025-07-11",
        sinopsis:
          "Clark Kent intenta reconciliar su herencia kryptoniana con su educación humana como Clark Kent de Smallville, Kansas.",
        imagen_url:
          "https://image.tmdb.org/t/p/w500/4B7liCxNCZIZGONmAMkCnxVlZQV.jpg",
        tipo: "proxEstreno",
        estado: "activa",
      },
    ]);
    console.log(`✅ ${peliculas.length} películas creadas\n`);

    // 3. SEDES
    console.log("🏢 Creando sedes...");
    const sedes = await Sede.bulkCreate([
      {
        nombre: "CINESTAR Jockey Plaza",
        direccion: "Av. Javier Prado Este 4200, Santiago de Surco",
        ciudad: "Lima",
        telefono: "016259090",
        email: "jockeyplaza@cinestar.com.pe",
        estado: "activa",
      },
      {
        nombre: "CINESTAR Plaza San Miguel",
        direccion: "Av. La Marina 2000, San Miguel",
        ciudad: "Lima",
        telefono: "016259091",
        email: "sanmiguel@cinestar.com.pe",
        estado: "activa",
      },
      {
        nombre: "CINESTAR Excelsior",
        direccion: "Jr. Ica 770, Centro de Lima",
        ciudad: "Lima",
        telefono: "016259092",
        email: "excelsior@cinestar.com.pe",
        estado: "activa",
      },
      {
        nombre: "CINESTAR Mall del Sur",
        direccion: "Av. Caminos del Inca 1311, San Juan de Miraflores",
        ciudad: "Lima",
        telefono: "016259093",
        email: "malldelsur@cinestar.com.pe",
        estado: "activa",
      },
      {
        nombre: "CINESTAR Plaza Norte",
        direccion: "Av. Alfredo Mendiola 1400, Independencia",
        ciudad: "Lima",
        telefono: "016259094",
        email: "plazanorte@cinestar.com.pe",
        estado: "activa",
      },
      {
        nombre: "CINESTAR Las Américas",
        direccion: "Av. Aviación 2405, San Borja",
        ciudad: "Lima",
        telefono: "016259095",
        email: "lasamericas@cinestar.com.pe",
        estado: "activa",
      },
    ]);
    console.log(`✅ ${sedes.length} sedes creadas\n`);

    // 4. SALAS (4 salas por sede = 24 salas total)
    console.log("🎭 Creando salas...");
    const salas = [];
    for (const sede of sedes) {
      const salasXSede = await Sala.bulkCreate([
        {
          nombre: "Sala 1 - IMAX 4K",
          filas: 15,
          columnas: 20,
          id_sede: sede.id,
          estado: "activa",
        },
        {
          nombre: "Sala 2 - 3D Dolby Atmos",
          filas: 12,
          columnas: 18,
          id_sede: sede.id,
          estado: "activa",
        },
        {
          nombre: "Sala 3 - Premium VIP",
          filas: 8,
          columnas: 12,
          id_sede: sede.id,
          estado: "activa",
        },
        {
          nombre: "Sala 4 - Estándar",
          filas: 10,
          columnas: 16,
          id_sede: sede.id,
          estado: "activa",
        },
      ]);
      salas.push(...salasXSede);
    }
    console.log(`✅ ${salas.length} salas creadas\n`);

    // 5. FUNCIONES (Más funciones para películas en cartelera)
    console.log("📅 Creando funciones...");
    const funciones = [];
    const horas = ["11:00:00", "14:00:00", "17:00:00", "20:00:00", "22:30:00"];
    
    // Crear funciones para las primeras 12 películas (todas las de cartelera)
    const peliculasCartelera = peliculas.filter(p => p.tipo === "cartelera");
    
    for (const pelicula of peliculasCartelera) {
      for (let dia = 0; dia < 7; dia++) {
        // 7 días de funciones
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + dia);
        const fechaStr = fecha.toISOString().split("T")[0];
        
        // Cada película se muestra en 2-3 salas diferentes por día
        const numSalas = dia < 3 ? 3 : 2; // Más salas los primeros días
        
        for (let s = 0; s < numSalas; s++) {
          const salaIndex = (peliculasCartelera.indexOf(pelicula) * 3 + s + dia) % salas.length;
          const sala = salas[salaIndex];
          
          // 2-3 horarios por sala
          const numHorarios = s === 0 ? 3 : 2;
          for (let h = 0; h < numHorarios; h++) {
            const horaIndex = (s * 2 + h) % horas.length;
            const hora = horas[horaIndex];
            
            const funcion = await Funcion.create({
              id_pelicula: pelicula.id,
              id_sala: sala.id,
              fecha: fechaStr,
              hora: hora,
              estado: "activa",
              es_privada: false,
            });
            funciones.push(funcion);
          }
        }
      }
    }
    console.log(`✅ ${funciones.length} funciones creadas\n`);

    // 6. COMBOS
    console.log("🍿 Creando combos...");
    const combos = await Combo.bulkCreate([
      {
        nombre: "Combo Individual",
        descripcion: "1 Canchita mediana + 1 Bebida mediana",
        precio: 18.5,
        imagen_url: "https://via.placeholder.com/300x200/FFD700/000000?text=Combo+Individual",
        estado: "activo",
      },
      {
        nombre: "Combo Pareja",
        descripcion: "1 Canchita grande + 2 Bebidas medianas",
        precio: 28.9,
        imagen_url: "https://via.placeholder.com/300x200/FF6347/FFFFFF?text=Combo+Pareja",
        estado: "activo",
      },
      {
        nombre: "Combo Familiar",
        descripcion: "2 Canchitas grandes + 4 Bebidas grandes",
        precio: 45.0,
        imagen_url: "https://via.placeholder.com/300x200/32CD32/000000?text=Combo+Familiar",
        estado: "activo",
      },
      {
        nombre: "Combo XL Premium",
        descripcion: "1 Canchita jumbo + 1 Bebida jumbo + Nachos + Hot Dog",
        precio: 39.9,
        imagen_url: "https://via.placeholder.com/300x200/FF1493/FFFFFF?text=Combo+XL",
        estado: "activo",
      },
      {
        nombre: "Combo Kids",
        descripcion: "1 Canchita pequeña + 1 Bebida pequeña + Dulces sorpresa",
        precio: 15.5,
        imagen_url: "https://via.placeholder.com/300x200/87CEEB/000000?text=Combo+Kids",
        estado: "activo",
      },
      {
        nombre: "Combo Gamer",
        descripcion: "Canchita grande + Bebida energética + Nachos con queso",
        precio: 32.5,
        imagen_url: "https://via.placeholder.com/300x200/9370DB/FFFFFF?text=Combo+Gamer",
        estado: "activo",
      },
      {
        nombre: "Combo Dulce",
        descripcion: "Canchita dulce mediana + Bebida + M&M's + Kit Kat",
        precio: 25.9,
        imagen_url: "https://via.placeholder.com/300x200/FF69B4/FFFFFF?text=Combo+Dulce",
        estado: "activo",
      },
      {
        nombre: "Combo Salado",
        descripcion: "Canchita salada grande + Bebida + Doritos + Hot Dog",
        precio: 29.9,
        imagen_url: "https://via.placeholder.com/300x200/FFA500/000000?text=Combo+Salado",
        estado: "activo",
      },
      {
        nombre: "Combo Mega",
        descripcion: "2 Canchitas jumbo + 2 Bebidas jumbo + 2 Hot Dogs + Nachos",
        precio: 55.0,
        imagen_url: "https://via.placeholder.com/300x200/DC143C/FFFFFF?text=Combo+Mega",
        estado: "activo",
      },
      {
        nombre: "Combo Saludable",
        descripcion: "Agua mineral + Fruta picada + Cereal bar + Yogurt",
        precio: 12.9,
        imagen_url: "https://via.placeholder.com/300x200/00FA9A/000000?text=Combo+Saludable",
        estado: "activo",
      },
    ]);
    console.log(`✅ ${combos.length} combos creados\n`);

    // 7. MÉTODOS DE PAGO
    console.log("💳 Creando métodos de pago...");
    const metodosPago = await MetodoPago.bulkCreate([
      { nombre: "Tarjeta de Crédito/Débito" },
      { nombre: "Yape" },
      { nombre: "Plin" },
      { nombre: "Efectivo" },
      { nombre: "Transferencia Bancaria" },
    ]);
    console.log(`✅ ${metodosPago.length} métodos de pago creados\n`);

    // 8. TIPOS DE TICKET
    console.log("🎫 Creando tipos de ticket...");
    const tiposTicket = await TipoTicket.bulkCreate([
      { nombre: "Adulto", precio_base: 15.00 },
      { nombre: "Niño", precio_base: 10.00 },
      { nombre: "Adulto Mayor", precio_base: 10.00 },
      { nombre: "CONADIS", precio_base: 8.00 },
    ]);
    console.log(`✅ ${tiposTicket.length} tipos de ticket creados\n`);

    // 9. PUBLICIDAD
    console.log("📺 Creando publicidad...");
    const publicidades = await Publicidad.bulkCreate([
      {
        titulo: "¡Nuevos estrenos cada semana!",
        descripcion: "No te pierdas las películas más esperadas del año",
        tipo: "banner",
        ubicacion: "home",
        imagen_url: "https://via.placeholder.com/1200x300/e60000/FFFFFF?text=Nuevos+Estrenos",
        url_destino: "/movies",
        orden: 1,
        fecha_inicio: new Date(),
        fecha_fin: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        estado: "activa",
      },
      {
        titulo: "Miércoles de Descuento",
        descripcion: "Todos los boletos a S/ 10.00 los días miércoles",
        tipo: "banner",
        ubicacion: "home",
        imagen_url: "https://via.placeholder.com/1200x300/FFD700/000000?text=Miércoles+de+Descuento",
        url_destino: "/movies",
        orden: 2,
        fecha_inicio: new Date(),
        fecha_fin: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        estado: "activa",
      },
      {
        titulo: "Sala IMAX disponible",
        descripcion: "Vive la experiencia cinematográfica definitiva",
        tipo: "banner",
        ubicacion: "home",
        imagen_url: "https://via.placeholder.com/1200x300/1a1a1a/00BFFF?text=Experiencia+IMAX",
        url_destino: "/cinemas",
        orden: 3,
        fecha_inicio: new Date(),
        fecha_fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        estado: "activa",
      },
      {
        titulo: "Combos especiales",
        descripcion: "Ahorra hasta 30% en nuestros combos familiares",
        tipo: "popup",
        ubicacion: "candy-shop",
        imagen_url: "https://via.placeholder.com/600x400/32CD32/FFFFFF?text=Combos+Especiales",
        url_destino: "/candy-shop",
        orden: 1,
        fecha_inicio: new Date(),
        fecha_fin: new Date(new Date().setMonth(new Date().getMonth() + 2)),
        estado: "activa",
      },
      {
        titulo: "Programas corporativos",
        descripcion: "Beneficios exclusivos para empresas",
        tipo: "banner",
        ubicacion: "corporate",
        imagen_url: "https://via.placeholder.com/1200x300/4B0082/FFFFFF?text=Ventas+Corporativas",
        url_destino: "/corporate-sales",
        orden: 1,
        fecha_inicio: new Date(),
        fecha_fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        estado: "activa",
      },
    ]);
    console.log(`✅ ${publicidades.length} publicidades creadas\n`);

    console.log("\n🎉 ¡Seed completado exitosamente!\n");
    console.log("📊 Resumen de datos insertados:");
    console.log(`   - ${usuarios.length} usuarios (${usuarios.filter(u => u.rol === 'admin').length} admin, ${usuarios.filter(u => u.rol === 'cliente').length} clientes, ${usuarios.filter(u => u.rol === 'corporativo').length} corporativos)`);
    console.log(`   - ${peliculas.length} películas (${peliculas.filter(p => p.tipo === 'cartelera').length} en cartelera, ${peliculas.filter(p => p.tipo === 'proxEstreno').length} próximos estrenos)`);
    console.log(`   - ${sedes.length} sedes`);
    console.log(`   - ${salas.length} salas`);
    console.log(`   - ${funciones.length} funciones programadas`);
    console.log(`   - ${combos.length} combos disponibles`);
    console.log(`   - ${metodosPago.length} métodos de pago`);
    console.log(`   - ${tiposTicket.length} tipos de ticket`);
    console.log(`   - ${publicidades.length} publicidades activas\n`);
    
    console.log("🔑 Credenciales de prueba:");
    console.log("   Admin: admin@cinestar.com / 123456");
    console.log("   Cliente: juan@gmail.com / 123456");
    console.log("   Cliente: maria@gmail.com / 123456");
    console.log("   Corporativo: corporativo@bcp.com.pe / 123456\n");
    
    console.log("💡 Los datos persistirán en la base de datos.");
    console.log("💡 Para reinsertar datos, elimina manualmente los registros.\n");
    console.log(`   - ${salas.length} salas`);
    console.log(`   - ${funciones.length} funciones`);
    console.log(`   - ${combos.length} combos`);
    console.log(`   - ${metodosPago.length} métodos de pago`);
    console.log(`   - ${tiposTicket.length} tipos de ticket\n`);

    console.log("🔐 Credenciales de prueba:");
    console.log("   Admin: admin@cinestar.com / 123456");
    console.log("   Cliente: juan@gmail.com / 123456");
    console.log("   Cliente: maria@gmail.com / 123456");
    console.log("   Corporativo: corporativo@empresa.com / 123456\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    process.exit(1);
  }
};

seedDatabase();
