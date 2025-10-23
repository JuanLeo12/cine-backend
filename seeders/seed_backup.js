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
      {
        nombre: "Administrador",
        email: "admin@cinestar.com",
        password: hashedPassword,
        rol: "admin",
        estado: "activo",
      },
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
        nombre: "Empresa Corp SAC",
        email: "corporativo@empresa.com",
        password: hashedPassword,
        telefono: "943217865",
        rol: "corporativo",
        estado: "activo",
        ruc: "20123456789",
        representante: "Carlos Rodriguez",
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
        nombre: "Cinestar Jockey Plaza",
        direccion: "Av. Javier Prado Este 4200, Santiago de Surco",
        ciudad: "Lima",
        telefono: "016195555",
      },
      {
        nombre: "Cinestar Centro Civico",
        direccion: "Jr. Huanta 150, Lima",
        ciudad: "Lima",
        telefono: "014338888",
      },
      {
        nombre: "Cinestar San Juan de Lurigancho",
        direccion: "Av. Próceres de la Independencia 1632, San Juan de Lurigancho",
        ciudad: "Lima",
        telefono: "014567890",
      },
    ]);
    console.log(`✅ ${sedes.length} sedes creadas\n`);

    // 4. SALAS
    console.log("🎭 Creando salas...");
    const salas = [];
    for (const sede of sedes) {
      const salasXSede = await Sala.bulkCreate([
        {
          nombre: "Sala 1 - IMAX",
          filas: 12,
          columnas: 16,
          id_sede: sede.id,
          estado: "activa",
        },
        {
          nombre: "Sala 2 - 3D",
          filas: 10,
          columnas: 14,
          id_sede: sede.id,
          estado: "activa",
        },
        {
          nombre: "Sala 3 - Premium",
          filas: 8,
          columnas: 12,
          id_sede: sede.id,
          estado: "activa",
        },
      ]);
      salas.push(...salasXSede);
    }
    console.log(`✅ ${salas.length} salas creadas\n`);

    // 5. FUNCIONES
    console.log("📅 Creando funciones...");
    const funciones = [];
    const horas = ["14:00:00", "17:00:00", "20:00:00", "22:30:00"];
    
    // Crear funciones evitando duplicados de sala-fecha-hora
    for (const pelicula of peliculas.slice(0, 5)) {
      // Solo películas en cartelera
      for (let i = 0; i < 3; i++) {
        // 3 días diferentes
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + i);
        const fechaStr = fecha.toISOString().split("T")[0];
        
        // Distribuir películas en salas diferentes
        let salaIndex = peliculas.indexOf(pelicula) % salas.length;
        
        for (let h = 0; h < 2; h++) {
          // 2 horarios por día
          const sala = salas[salaIndex];
          const hora = horas[(i * 2 + h) % horas.length];
          
          const funcion = await Funcion.create({
            id_pelicula: pelicula.id,
            id_sala: sala.id,
            fecha: fechaStr,
            hora: hora,
            estado: "activa",
            es_privada: false,
          });
          funciones.push(funcion);
          
          // Rotar a la siguiente sala
          salaIndex = (salaIndex + 1) % salas.length;
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
        imagen_url: "https://via.placeholder.com/300x200?text=Combo+Individual",
      },
      {
        nombre: "Combo Pareja",
        descripcion: "1 Canchita grande + 2 Bebidas medianas",
        precio: 28.9,
        imagen_url: "https://via.placeholder.com/300x200?text=Combo+Pareja",
      },
      {
        nombre: "Combo Familiar",
        descripcion: "2 Canchitas grandes + 4 Bebidas grandes",
        precio: 45.0,
        imagen_url: "https://via.placeholder.com/300x200?text=Combo+Familiar",
      },
      {
        nombre: "Combo XL",
        descripcion: "1 Canchita jumbo + 1 Bebida jumbo + Nachos",
        precio: 35.9,
        imagen_url: "https://via.placeholder.com/300x200?text=Combo+XL",
      },
      {
        nombre: "Combo Kids",
        descripcion: "1 Canchita pequeña + 1 Bebida pequeña + Dulces",
        precio: 15.5,
        imagen_url: "https://via.placeholder.com/300x200?text=Combo+Kids",
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

    console.log("\n🎉 ¡Seed completado exitosamente!\n");
    console.log("📊 Resumen:");
    console.log(`   - ${usuarios.length} usuarios`);
    console.log(`   - ${peliculas.length} películas`);
    console.log(`   - ${sedes.length} sedes`);
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
