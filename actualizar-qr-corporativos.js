/**
 * Script para actualizar QR de boletas corporativas existentes
 * Agrega campos: empresa, representante (con nombre, email, cargo)
 */

require('dotenv').config();
const { BoletaCorporativa, Funcion, AlquilerSala, Sala, Sede, Pelicula, Usuario, Publicidad, ValeCorporativo, Pago, OrdenCompra } = require('./models');
const crypto = require('crypto');

/**
 * Genera código QR único con información estructurada
 * (Copia de la función actualizada en boletasCorporativasController.js)
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
        {
          model: Pelicula,
          as: 'pelicula',
          attributes: ['titulo', 'duracion']
        },
        {
          model: Sala,
          as: 'sala',
          attributes: ['nombre', 'tipo_sala'],
          include: [{
            model: Sede,
            as: 'sede',
            attributes: ['nombre', 'ciudad']
          }]
        },
        {
          model: Usuario,
          as: 'clienteCorporativo',
          attributes: ['nombre', 'email', 'representante', 'cargo']
        }
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
          include: [{
            model: Sede,
            as: 'sede',
            attributes: ['nombre', 'ciudad', 'direccion']
          }]
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'email', 'representante', 'cargo']
        }
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
        {
          model: Sede,
          as: 'sede',
          attributes: ['nombre', 'ciudad']
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'email', 'representante', 'cargo']
        }
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
 * Actualizar todas las boletas corporativas existentes
 */
const actualizarBoletasCorporativas = async () => {
  try {
    console.log('🔄 Iniciando actualización de QR de boletas corporativas...\n');

    // Obtener todas las boletas corporativas
    const boletas = await BoletaCorporativa.findAll({
      order: [['id', 'ASC']]
    });

    console.log(`📋 Total de boletas encontradas: ${boletas.length}\n`);

    let actualizadas = 0;
    let errores = 0;

    for (const boleta of boletas) {
      try {
        console.log(`Procesando boleta #${boleta.id} - Tipo: ${boleta.tipo}`);

        // Extraer el código único del QR actual
        let codigoUnico = boleta.codigo;
        
        // Si no tiene código, generar uno nuevo
        if (!codigoUnico) {
          const timestamp = Date.now().toString(36).toUpperCase();
          const random = crypto.randomBytes(4).toString('hex').toUpperCase();
          codigoUnico = `CORP-${timestamp}-${random}`;
          console.log(`  ⚠️  Generando código único nuevo: ${codigoUnico}`);
        }

        // Regenerar el QR con la nueva estructura
        const nuevoQR = await generarDatosQR(boleta.tipo, boleta.id_referencia, codigoUnico);

        // Actualizar en la base de datos
        await boleta.update({
          codigo: codigoUnico,
          codigo_qr: nuevoQR
        });

        actualizadas++;
        console.log(`  ✅ Boleta #${boleta.id} actualizada correctamente\n`);
      } catch (error) {
        errores++;
        console.error(`  ❌ Error procesando boleta #${boleta.id}:`, error.message);
        console.error(`     Stack:`, error.stack);
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

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error general:', error);
    process.exit(1);
  }
};

// Ejecutar
actualizarBoletasCorporativas();
