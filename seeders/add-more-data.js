const bcrypt = require("bcryptjs");
const {
  Usuario,
  Pelicula,
  Sede,
  Sala,
  Funcion,
  Combo,
  sequelize,
} = require("../models");

/**
 * Script para AGREGAR más datos sin borrar los existentes
 * Verifica qué falta y solo agrega lo nuevo
 */
const addMoreData = async () => {
  try {
    console.log("🌱 Agregando más datos realistas a la base de datos...\n");

    await sequelize.sync({ alter: true });
    console.log("✅ Base de datos sincronizada\n");

    const hashedPassword = await bcrypt.hash("123456", 10);

    // 1. AGREGAR MÁS USUARIOS
    console.log("👥 Verificando usuarios...");
    const usuariosCount = await Usuario.count();
    if (usuariosCount < 9) {
      const nuevosUsuarios = [
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
      ];

      for (const usuario of nuevosUsuarios) {
        const existe = await Usuario.findOne({ where: { email: usuario.email } });
        if (!existe) {
          await Usuario.create(usuario);
          console.log(`   ✓ Usuario ${usuario.nombre} creado`);
        }
      }
    }
    const totalUsuarios = await Usuario.count();
    console.log(`✅ Total usuarios: ${totalUsuarios}\n`);

    // 2. AGREGAR MÁS PELÍCULAS
    console.log("🎬 Verificando películas...");
    const peliculasCount = await Pelicula.count();
    if (peliculasCount < 20) {
      const nuevasPeliculas = [
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
        // PRÓXIMOS ESTRENOS
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
      ];

      for (const pelicula of nuevasPeliculas) {
        const existe = await Pelicula.findOne({ where: { titulo: pelicula.titulo } });
        if (!existe) {
          await Pelicula.create(pelicula);
          console.log(`   ✓ Película "${pelicula.titulo}" agregada`);
        }
      }
    }
    const totalPeliculas = await Pelicula.count();
    console.log(`✅ Total películas: ${totalPeliculas}\n`);

    // 3. AGREGAR MÁS SEDES
    console.log("🏢 Verificando sedes...");
    const sedesCount = await Sede.count();
    if (sedesCount < 6) {
      const nuevasSedes = [
        {
          nombre: "CINESTAR Mall del Sur",
          direccion: "Av. Caminos del Inca 1311, San Juan de Miraflores",
          ciudad: "Lima",
          telefono: "016259093",
          email: "malldelsur@cinestar.com.pe",
          estado: "activo",
        },
        {
          nombre: "CINESTAR Plaza Norte",
          direccion: "Av. Alfredo Mendiola 1400, Independencia",
          ciudad: "Lima",
          telefono: "016259094",
          email: "plazanorte@cinestar.com.pe",
          estado: "activo",
        },
        {
          nombre: "CINESTAR Las Américas",
          direccion: "Av. Aviación 2405, San Borja",
          ciudad: "Lima",
          telefono: "016259095",
          email: "lasamericas@cinestar.com.pe",
          estado: "activo",
        },
      ];

      for (const sede of nuevasSedes) {
        const existe = await Sede.findOne({ where: { nombre: sede.nombre } });
        if (!existe) {
          const nuevaSede = await Sede.create(sede);
          console.log(`   ✓ Sede "${sede.nombre}" creada`);

          // Crear 4 salas para esta sede
          await Sala.bulkCreate([
            {
              nombre: "Sala 1 - IMAX 4K",
              filas: 15,
              columnas: 20,
              id_sede: nuevaSede.id,
              estado: "activa",
            },
            {
              nombre: "Sala 2 - 3D Dolby Atmos",
              filas: 12,
              columnas: 18,
              id_sede: nuevaSede.id,
              estado: "activa",
            },
            {
              nombre: "Sala 3 - Premium VIP",
              filas: 8,
              columnas: 12,
              id_sede: nuevaSede.id,
              estado: "activa",
            },
            {
              nombre: "Sala 4 - Estándar",
              filas: 10,
              columnas: 16,
              id_sede: nuevaSede.id,
              estado: "activa",
            },
          ]);
          console.log(`      → 4 salas creadas para ${sede.nombre}`);
        }
      }
    }
    const totalSedes = await Sede.count();
    const totalSalas = await Sala.count();
    console.log(`✅ Total sedes: ${totalSedes}`);
    console.log(`✅ Total salas: ${totalSalas}\n`);

    // 4. AGREGAR MÁS COMBOS
    console.log("🍿 Verificando combos...");
    const combosCount = await Combo.count();
    if (combosCount < 10) {
      const nuevosCombos = [
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
      ];

      for (const combo of nuevosCombos) {
        const existe = await Combo.findOne({ where: { nombre: combo.nombre } });
        if (!existe) {
          await Combo.create(combo);
          console.log(`   ✓ Combo "${combo.nombre}" agregado`);
        }
      }
    }
    const totalCombos = await Combo.count();
    console.log(`✅ Total combos: ${totalCombos}\n`);

    // 5. AGREGAR MÁS FUNCIONES (sin duplicar)
    console.log("📅 Verificando funciones...");
    const funcionesIniciales = await Funcion.count();
    
    if (funcionesIniciales < 100) {
      console.log("   Agregando más funciones para completar la cartelera...");
      const todasPeliculas = await Pelicula.findAll({ where: { tipo: "cartelera" } });
      const todasSalas = await Sala.findAll();
      const horas = ["11:00:00", "14:00:00", "17:00:00", "20:00:00", "22:30:00"];
      
      let funcionesAgregadas = 0;
      const maxIntentos = 200; // Limitar intentos para evitar bucle infinito
      let intentos = 0;

      while (funcionesAgregadas < 50 && intentos < maxIntentos) {
        intentos++;
        
        // Seleccionar película, sala, día y hora aleatoriamente
        const pelicula = todasPeliculas[Math.floor(Math.random() * todasPeliculas.length)];
        const sala = todasSalas[Math.floor(Math.random() * todasSalas.length)];
        const diaOffset = Math.floor(Math.random() * 7); // 0-6 días desde hoy
        const hora = horas[Math.floor(Math.random() * horas.length)];
        
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + diaOffset);
        const fechaStr = fecha.toISOString().split("T")[0];

        // Verificar si ya existe
        const existe = await Funcion.findOne({
          where: {
            id_sala: sala.id,
            fecha: fechaStr,
            hora: hora,
          },
        });

        if (!existe) {
          await Funcion.create({
            id_pelicula: pelicula.id,
            id_sala: sala.id,
            fecha: fechaStr,
            hora: hora,
            estado: "activa",
            es_privada: false,
          });
          funcionesAgregadas++;
        }
      }
      
      console.log(`   ✓ ${funcionesAgregadas} funciones nuevas agregadas`);
    }
    
    const totalFunciones = await Funcion.count();
    console.log(`✅ Total funciones: ${totalFunciones}\n`);

    console.log("\n🎉 ¡Datos adicionales agregados exitosamente!\n");
    console.log("📊 Resumen final:");
    console.log(`   - ${await Usuario.count()} usuarios`);
    console.log(`   - ${await Pelicula.count()} películas`);
    console.log(`   - ${await Sede.count()} sedes`);
    console.log(`   - ${await Sala.count()} salas`);
    console.log(`   - ${await Funcion.count()} funciones`);
    console.log(`   - ${await Combo.count()} combos\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error al agregar datos:", error.message);
    console.error(error);
    process.exit(1);
  }
};

addMoreData();
