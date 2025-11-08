/**
 * Script para actualizar QR de boletas corporativas existentes EN RAILWAY
 * Agrega campos: empresa, representante (con nombre, email, cargo)
 * 
 * IMPORTANTE: Este script se conecta a la base de datos de PRODUCCIÓN en Railway
 */

const { Sequelize, DataTypes } = require('sequelize');
const crypto = require('crypto');

// ⚠️ CONFIGURACIÓN DE BASE DE DATOS DE RAILWAY (PRODUCCIÓN)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:NHnawdJgaWJXKLIVwVGNTunbDpKOIdKy@postgres.railway.internal:5432/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false // Railway internal no necesita SSL
  }
});

// Definir modelos (simplificados para el script)
const BoletaCorporativa = sequelize.define('BoletaCorporativa', {
  tipo: DataTypes.STRING(50),
  id_referencia: DataTypes.INTEGER,
  codigo: DataTypes.STRING(50),
  codigo_qr: DataTypes.TEXT,
}, { tableName: 'boletas_corporativas', timestamps: false });

const Funcion = sequelize.define('Funcion', {
  fecha: DataTypes.DATEONLY,
  hora_inicio: DataTypes.TIME,
  hora_fin: DataTypes.TIME,
  descripcion_evento: DataTypes.STRING(500),
  id_sala: DataTypes.INTEGER,
  id_pelicula: DataTypes.INTEGER,
  id_cliente_corporativo: DataTypes.INTEGER,
}, { tableName: 'funciones', timestamps: false });

const AlquilerSala = sequelize.define('AlquilerSala', {
  fecha: DataTypes.DATEONLY,
  hora_inicio: DataTypes.TIME,
  hora_fin: DataTypes.TIME,
  descripcion_evento: DataTypes.STRING(500),
  precio: DataTypes.DECIMAL(10, 2),
  id_sala: DataTypes.INTEGER,
  id_usuario: DataTypes.INTEGER,
}, { tableName: 'alquileres_salas', timestamps: false });

const Publicidad = sequelize.define('Publicidad', {
  tipo: DataTypes.STRING(50),
  cliente: DataTypes.STRING(200),
  descripcion: DataTypes.TEXT,
  fecha_inicio: DataTypes.DATEONLY,
  fecha_fin: DataTypes.DATEONLY,
  precio: DataTypes.DECIMAL(10, 2),
  estado: DataTypes.STRING(20),
  archivo_publicidad: DataTypes.STRING(500),
  id_sede: DataTypes.INTEGER,
  id_usuario: DataTypes.INTEGER,
}, { tableName: 'publicidades', timestamps: false });

const ValeCorporativo = sequelize.define('ValeCorporativo', {
  codigo: DataTypes.STRING(50),
  tipo: DataTypes.STRING(20),
  valor: DataTypes.DECIMAL(10, 2),
  fecha_expiracion: DataTypes.DATEONLY,
  cantidad_usos: DataTypes.INTEGER,
  usos_disponibles: DataTypes.INTEGER,
  usado: DataTypes.BOOLEAN,
  id_pago: DataTypes.INTEGER,
}, { tableName: 'vales_corporativos', timestamps: false });

const Usuario = sequelize.define('Usuario', {
  nombre: DataTypes.STRING(100),
  email: DataTypes.STRING(100),
  representante: DataTypes.STRING(100),
  cargo: DataTypes.STRING(100),
}, { tableName: 'usuarios', timestamps: false });

const Pelicula = sequelize.define('Pelicula', {
  titulo: DataTypes.STRING(200),
  duracion: DataTypes.INTEGER,
}, { tableName: 'peliculas', timestamps: false });

const Sala = sequelize.define('Sala', {
  nombre: DataTypes.STRING(50),
  tipo_sala: DataTypes.STRING(20),
  capacidad: DataTypes.INTEGER,
  filas: DataTypes.INTEGER,
  columnas: DataTypes.INTEGER,
  id_sede: DataTypes.INTEGER,
}, { tableName: 'salas', timestamps: false });

const Sede = sequelize.define('Sede', {
  nombre: DataTypes.STRING(100),
  ciudad: DataTypes.STRING(50),
  direccion: DataTypes.STRING(200),
}, { tableName: 'sedes', timestamps: false });

const Pago = sequelize.define('Pago', {
  id_orden_compra: DataTypes.INTEGER,
}, { tableName: 'pagos', timestamps: false });

const OrdenCompra = sequelize.define('OrdenCompra', {
  id_usuario: DataTypes.INTEGER,
}, { tableName: 'ordenes_compra', timestamps: false });

// Asociaciones
Funcion.belongsTo(Pelicula, { foreignKey: 'id_pelicula', as: 'pelicula' });
Funcion.belongsTo(Sala, { foreignKey: 'id_sala', as: 'sala' });
Funcion.belongsTo(Usuario, { foreignKey: 'id_cliente_corporativo', as: 'clienteCorporativo' });
Sala.belongsTo(Sede, { foreignKey: 'id_sede', as: 'sede' });
AlquilerSala.belongsTo(Sala, { foreignKey: 'id_sala', as: 'sala' });
AlquilerSala.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Publicidad.belongsTo(Sede, { foreignKey: 'id_sede', as: 'sede' });
Publicidad.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Pago.belongsTo(OrdenCompra, { foreignKey: 'id_orden_compra', as: 'orden' });
OrdenCompra.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

/**
 * Genera código QR actualizado
 */
const generarDatosQR = async (tipo, id_referencia, codigo_unico) => {
  const fechaEmision = new Date().toLocaleString('es-PE', { 
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  let datosQR = {
    tipo: tipo.toUpperCase().replace('_', '_'),
    codigo: codigo_unico,
    fecha_emision: fechaEmision
  };

  if (tipo === 'funcion_privada') {
    const funcion = await Funcion.findByPk(id_referencia, {
      include: [
        { model: Pelicula, as: 'pelicula', attributes: ['titulo', 'duracion'] },
        { 
          model: Sala, 
          as: 'sala', 
          attributes: ['nombre', 'tipo_sala'],
          include: [{ model: Sede, as: 'sede', attributes: ['nombre', 'ciudad'] }]
        },
        { model: Usuario, as: 'clienteCorporativo', attributes: ['nombre', 'email', 'representante', 'cargo'] }
      ]
    });

    datosQR.servicio = {
      tipo_servicio: 'Función Privada',
      descripcion: funcion.descripcion_evento || 'Función Privada',
      pelicula: funcion.pelicula?.titulo || 'N/A',
      fecha: funcion.fecha,
      hora_inicio: funcion.hora_inicio,
      hora_fin: funcion.hora_fin,
      duracion: '3 horas',
      ubicacion: {
        sede: funcion.sala?.sede?.nombre || 'N/A',
        ciudad: funcion.sala?.sede?.ciudad || 'N/A',
        sala: funcion.sala?.nombre || 'N/A',
        tipo_sala: funcion.sala?.tipo_sala || 'N/A'
      },
      empresa: funcion.clienteCorporativo?.nombre || 'N/A',
      representante: {
        nombre: funcion.clienteCorporativo?.representante || 'N/A',
        email: funcion.clienteCorporativo?.email || 'N/A',
        cargo: funcion.clienteCorporativo?.cargo || 'N/A'
      },
      id_funcion: funcion.id
    };
  } else if (tipo === 'alquiler_sala') {
    const alquiler = await AlquilerSala.findByPk(id_referencia, {
      include: [
        { 
          model: Sala, 
          as: 'sala', 
          attributes: ['nombre', 'tipo_sala', 'capacidad'],
          include: [{ model: Sede, as: 'sede', attributes: ['nombre', 'ciudad', 'direccion'] }]
        },
        { model: Usuario, as: 'usuario', attributes: ['nombre', 'email', 'representante', 'cargo'] }
      ]
    });

    const [horaIni, minIni] = alquiler.hora_inicio.split(':').map(Number);
    const [horaFin, minFin] = alquiler.hora_fin.split(':').map(Number);
    const duracionHoras = ((horaFin * 60 + minFin) - (horaIni * 60 + minIni)) / 60;

    datosQR.servicio = {
      tipo_servicio: 'Alquiler de Sala',
      descripcion: alquiler.descripcion_evento || 'Alquiler de Sala',
      fecha: alquiler.fecha,
      hora_inicio: alquiler.hora_inicio,
      hora_fin: alquiler.hora_fin,
      duracion: `${duracionHoras.toFixed(1)} horas`,
      ubicacion: {
        sede: alquiler.sala?.sede?.nombre || 'N/A',
        ciudad: alquiler.sala?.sede?.ciudad || 'N/A',
        direccion: alquiler.sala?.sede?.direccion || 'N/A',
        sala: alquiler.sala?.nombre || 'N/A',
        tipo_sala: alquiler.sala?.tipo_sala || 'N/A',
        capacidad: alquiler.sala ? (alquiler.sala.filas * alquiler.sala.columnas) : 0
      },
      precio: parseFloat(alquiler.precio || 0),
      empresa: alquiler.usuario?.nombre || 'N/A',
      representante: {
        nombre: alquiler.usuario?.representante || 'N/A',
        email: alquiler.usuario?.email || 'N/A',
        cargo: alquiler.usuario?.cargo || 'N/A'
      },
      id_alquiler: alquiler.id
    };
  } else if (tipo === 'publicidad') {
    const publicidad = await Publicidad.findByPk(id_referencia, {
      include: [
        { model: Sede, as: 'sede', attributes: ['nombre', 'ciudad'] },
        { model: Usuario, as: 'usuario', attributes: ['nombre', 'email', 'representante', 'cargo'] }
      ]
    });

    const fechaIni = new Date(publicidad.fecha_inicio);
    const fechaFin = new Date(publicidad.fecha_fin);
    const dias = Math.ceil((fechaFin - fechaIni) / (1000 * 60 * 60 * 24)) + 1;

    datosQR.servicio = {
      tipo_servicio: 'Publicidad',
      tipo_publicidad: publicidad.tipo,
      descripcion: publicidad.descripcion || 'Campaña publicitaria',
      fecha_inicio: publicidad.fecha_inicio,
      fecha_fin: publicidad.fecha_fin,
      duracion_dias: dias,
      ubicacion: {
        sede: publicidad.sede?.nombre || 'N/A',
        ciudad: publicidad.sede?.ciudad || 'N/A'
      },
      precio: parseFloat(publicidad.precio || 0),
      estado: publicidad.estado,
      cliente: publicidad.cliente,
      empresa: publicidad.usuario?.nombre || 'N/A',
      representante: {
        nombre: publicidad.usuario?.representante || 'N/A',
        email: publicidad.usuario?.email || 'N/A',
        cargo: publicidad.usuario?.cargo || 'N/A'
      },
      id_publicidad: publicidad.id,
      archivo_publicidad: publicidad.archivo_publicidad || null
    };
  } else if (tipo === 'vales_corporativos') {
    const vale = await ValeCorporativo.findOne({
      where: { id_pago: id_referencia }
    });

    if (vale) {
      const pago = await Pago.findByPk(id_referencia, {
        include: [{
          model: OrdenCompra,
          as: 'orden',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'email', 'representante', 'cargo']
          }]
        }]
      });

      datosQR.servicio = {
        tipo_servicio: 'Vale Corporativo',
        codigo: vale.codigo,
        tipo: vale.tipo,
        valor_por_uso: parseFloat(vale.valor || 0),
        cantidad_usos_total: vale.cantidad_usos || 1,
        usos_disponibles: vale.usos_disponibles || 0,
        fecha_expiracion: vale.fecha_expiracion,
        estado: vale.usado ? 'agotado' : 'vigente',
        empresa: pago?.orden?.usuario?.nombre || 'N/A',
        representante: pago?.orden?.usuario ? {
          nombre: pago.orden.usuario.representante || 'N/A',
          email: pago.orden.usuario.email || 'N/A',
          cargo: pago.orden.usuario.cargo || 'N/A'
        } : null,
        id_pago: id_referencia
      };
    } else {
      datosQR.servicio = {
        tipo_servicio: 'Vales Corporativos',
        mensaje: 'Vale no encontrado',
        id_pago: id_referencia
      };
    }
  }

  return JSON.stringify(datosQR, null, 2);
};

/**
 * Ejecutar actualización
 */
const actualizarBoletasCorporativas = async () => {
  try {
    console.log('🚀 Conectando a Railway PostgreSQL...\n');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    console.log('🔄 Iniciando actualización de QR de boletas corporativas...\n');

    const boletas = await BoletaCorporativa.findAll({
      order: [['id', 'ASC']]
    });

    console.log(`📋 Total de boletas encontradas: ${boletas.length}\n`);

    let actualizadas = 0;
    let errores = 0;

    for (const boleta of boletas) {
      try {
        console.log(`Procesando boleta #${boleta.id} - Tipo: ${boleta.tipo}`);

        let codigoUnico = boleta.codigo;
        
        if (!codigoUnico) {
          const timestamp = Date.now().toString(36).toUpperCase();
          const random = crypto.randomBytes(4).toString('hex').toUpperCase();
          codigoUnico = `CORP-${timestamp}-${random}`;
          console.log(`  ⚠️  Generando código único nuevo: ${codigoUnico}`);
        }

        const nuevoQR = await generarDatosQR(boleta.tipo, boleta.id_referencia, codigoUnico);

        await boleta.update({
          codigo: codigoUnico,
          codigo_qr: nuevoQR
        });

        actualizadas++;
        console.log(`  ✅ Boleta #${boleta.id} actualizada correctamente\n`);
      } catch (error) {
        errores++;
        console.error(`  ❌ Error procesando boleta #${boleta.id}:`, error.message);
        console.log('');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE ACTUALIZACIÓN');
    console.log('='.repeat(60));
    console.log(`Total boletas: ${boletas.length}`);
    console.log(`✅ Actualizadas: ${actualizadas}`);
    console.log(`❌ Errores: ${errores}`);
    console.log('='.repeat(60));

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error general:', error);
    process.exit(1);
  }
};

// Ejecutar
actualizarBoletasCorporativas();
