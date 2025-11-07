/**
 * 🔄 SCRIPT DE RESTAURACIÓN DE RESPALDO
 * Restaura todos los datos desde un archivo de respaldo
 * Usar DESPUÉS de desplegar la base de datos en la nube
 */

const sequelize = require('./config/db');
const fs = require('fs');
const path = require('path');

// Importar todos los modelos
const {
  Sede,
  Sala,
  Pelicula,
  Funcion,
  TipoTicket,
  AsientoFuncion,
  Usuario,
  Combo,
  MetodoPago,
  OrdenCompra,
  OrdenTicket,
  OrdenCombo,
  Ticket,
  Pago,
  ValeCorporativo,
  BoletaCorporativa,
  AlquilerSala,
  Publicidad,
  TarifaCorporativa
} = require('./models');

async function restaurarRespaldo() {
  try {
    // Obtener archivo de respaldo (usar el más reciente si no se especifica)
    const archivoEspecificado = process.argv[2];
    let rutaArchivo;

    if (archivoEspecificado) {
      rutaArchivo = path.resolve(archivoEspecificado);
    } else {
      // Buscar el archivo más reciente en la carpeta respaldos
      const dirRespaldos = path.join(__dirname, 'respaldos');
      const archivos = fs.readdirSync(dirRespaldos)
        .filter(f => f.startsWith('respaldo-completo-') && f.endsWith('.json'))
        .map(f => ({
          nombre: f,
          ruta: path.join(dirRespaldos, f),
          fecha: fs.statSync(path.join(dirRespaldos, f)).mtime
        }))
        .sort((a, b) => b.fecha - a.fecha);

      if (archivos.length === 0) {
        console.error('❌ No se encontraron archivos de respaldo');
        process.exit(1);
      }

      rutaArchivo = archivos[0].ruta;
      console.log(`📁 Usando respaldo más reciente: ${archivos[0].nombre}\n`);
    }

    if (!fs.existsSync(rutaArchivo)) {
      console.error(`❌ Archivo no encontrado: ${rutaArchivo}`);
      process.exit(1);
    }

    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    console.log('📖 Leyendo archivo de respaldo...');
    const contenido = fs.readFileSync(rutaArchivo, 'utf8');
    const respaldo = JSON.parse(contenido);
    console.log(`✅ Respaldo cargado: ${respaldo.descripcion}`);
    console.log(`📅 Fecha de creación: ${new Date(respaldo.fecha_creacion).toLocaleString('es-PE')}\n`);

    // Orden de restauración (respetando dependencias)
    const tablasOrdenadas = [
      { nombre: 'sedes', modelo: Sede },
      { nombre: 'salas', modelo: Sala },
      { nombre: 'peliculas', modelo: Pelicula },
      { nombre: 'funciones', modelo: Funcion },
      { nombre: 'tipos_ticket', modelo: TipoTicket },
      { nombre: 'asientos_funcion', modelo: AsientoFuncion },
      { nombre: 'usuarios', modelo: Usuario },
      { nombre: 'combos', modelo: Combo },
      { nombre: 'metodos_pago', modelo: MetodoPago },
      { nombre: 'ordenes_compra', modelo: OrdenCompra },
      { nombre: 'ordenes_tickets', modelo: OrdenTicket },
      { nombre: 'ordenes_combos', modelo: OrdenCombo },
      { nombre: 'tickets', modelo: Ticket },
      { nombre: 'pagos', modelo: Pago },
      { nombre: 'vales_corporativos', modelo: ValeCorporativo },
      { nombre: 'boletas_corporativas', modelo: BoletaCorporativa },
      { nombre: 'alquileres_salas', modelo: AlquilerSala },
      { nombre: 'publicidad', modelo: Publicidad },
      { nombre: 'tarifas_corporativas', modelo: TarifaCorporativa }
    ];

    console.log('📦 Restaurando tablas...\n');

    let totalRestaurados = 0;

    for (const { nombre, modelo } of tablasOrdenadas) {
      const registros = respaldo.tablas[nombre] || [];
      
      if (registros.length === 0) {
        console.log(`⏭️  ${nombre.padEnd(25)} Sin datos`);
        continue;
      }

      try {
        // Insertar usando bulkCreate con ignoreDuplicates
        await modelo.bulkCreate(registros, {
          ignoreDuplicates: true,
          validate: false
        });

        totalRestaurados += registros.length;
        console.log(`✅ ${nombre.padEnd(25)} ${registros.length.toString().padStart(4)} registros restaurados`);
      } catch (error) {
        console.log(`⚠️  ${nombre.padEnd(25)} Error: ${error.message}`);
      }
    }

    // Actualizar secuencias de autoincremento
    console.log('\n🔄 Actualizando secuencias de autoincremento...');
    
    const tablesWithId = [
      'sedes', 'salas', 'peliculas', 'funciones', 'tipos_ticket',
      'asientos_funcion', 'usuarios', 'combos', 'metodos_pago',
      'ordenes_compra', 'ordenes_tickets', 'ordenes_combos', 'tickets',
      'pagos', 'vales_corporativos', 'boletas_corporativas',
      'alquileres_salas', 'publicidad', 'tarifas_corporativas'
    ];

    for (const tabla of tablesWithId) {
      try {
        await sequelize.query(`
          SELECT setval(
            pg_get_serial_sequence('${tabla}', 'id'),
            COALESCE((SELECT MAX(id) FROM ${tabla}), 1),
            true
          );
        `);
      } catch (error) {
        // Ignorar errores de tablas sin secuencia
      }
    }

    console.log('✅ Secuencias actualizadas\n');

    console.log('='.repeat(60));
    console.log('📦 RESTAURACIÓN COMPLETADA');
    console.log('='.repeat(60));
    console.log(`📊 Total de registros restaurados: ${totalRestaurados}`);
    console.log('='.repeat(60));
    console.log('\n✅ Todos tus datos han sido restaurados en la nube');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error restaurando respaldo:', error);
    process.exit(1);
  }
}

restaurarRespaldo();
