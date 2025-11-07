/**
 * 🔄 SCRIPT DE RESPALDO COMPLETO
 * Crea un respaldo de TODA la base de datos actual
 * Para subir a la nube con todos los datos
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

async function crearRespaldo() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    const respaldo = {
      fecha_creacion: new Date().toISOString(),
      version: '1.0.0',
      descripcion: 'Respaldo completo para migración a la nube',
      tablas: {}
    };

    // Orden de respaldo (respetando dependencias de foreign keys)
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

    let totalRegistros = 0;

    console.log('📦 Respaldando tablas...\n');

    for (const { nombre, modelo } of tablasOrdenadas) {
      try {
        const registros = await modelo.findAll({
          raw: true // Obtener objetos planos
        });

        respaldo.tablas[nombre] = registros;
        totalRegistros += registros.length;

        console.log(`✅ ${nombre.padEnd(25)} ${registros.length.toString().padStart(4)} registros`);
      } catch (error) {
        console.log(`⚠️  ${nombre.padEnd(25)} Error: ${error.message}`);
        respaldo.tablas[nombre] = [];
      }
    }

    // Crear directorio de respaldos si no existe
    const dirRespaldos = path.join(__dirname, 'respaldos');
    if (!fs.existsSync(dirRespaldos)) {
      fs.mkdirSync(dirRespaldos);
    }

    // Nombre del archivo con fecha y hora
    const fechaHora = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const nombreArchivo = `respaldo-completo-${fechaHora}.json`;
    const rutaArchivo = path.join(dirRespaldos, nombreArchivo);

    // Guardar respaldo
    fs.writeFileSync(rutaArchivo, JSON.stringify(respaldo, null, 2), 'utf8');

    // Calcular tamaño del archivo
    const stats = fs.statSync(rutaArchivo);
    const tamañoKB = (stats.size / 1024).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('📦 RESPALDO COMPLETADO');
    console.log('='.repeat(60));
    console.log(`📁 Archivo: ${nombreArchivo}`);
    console.log(`📊 Total de registros: ${totalRegistros}`);
    console.log(`💾 Tamaño: ${tamañoKB} KB`);
    console.log(`📍 Ubicación: ${rutaArchivo}`);
    console.log('='.repeat(60));
    console.log('\n✅ Listo para subir a la nube con todos tus datos actuales');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creando respaldo:', error);
    process.exit(1);
  }
}

crearRespaldo();
