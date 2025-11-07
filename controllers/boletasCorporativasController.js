const { BoletaCorporativa, Funcion, AlquilerSala, Sala, Sede, Pelicula, Usuario, Publicidad, ValeCorporativo, Pago, OrdenCompra, MetodoPago } = require('../models');
const crypto = require('crypto');

/**
 * Genera código QR único con información estructurada
 * Formato similar a los tickets regulares
 */
const generarDatosQR = async (tipo, id_referencia, codigo_unico) => {
  // Obtener fecha y hora en horario de Perú (UTC-5)
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

  // Estructura base ordenada
  let datosQR = {
    tipo: tipo.toUpperCase().replace('_', '_'),
    codigo: codigo_unico,
    fecha_emision: fechaEmision
  };

  // Obtener detalles según el tipo
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
          attributes: ['nombre', 'email', 'cargo']
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
      representante: {
        nombre: funcion.clienteCorporativo?.nombre || 'N/A',
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
          attributes: ['nombre', 'email', 'cargo']
        }
      ]
    });

    // Calcular duración
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
      representante: {
        nombre: alquiler.usuario?.nombre || 'N/A',
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
          attributes: ['nombre', 'email', 'cargo']
        }
      ]
    });

    // Calcular días de campaña
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
      representante: {
        nombre: publicidad.usuario?.nombre || 'N/A',
        email: publicidad.usuario?.email || 'N/A',
        cargo: publicidad.usuario?.cargo || 'N/A'
      },
      id_publicidad: publicidad.id,
      archivo_publicidad: publicidad.archivo_publicidad || null
    };
  } else if (tipo === 'vales_corporativos') {
    // Para vales corporativos, el id_referencia es el id_pago
    // Buscamos el vale asociado a ese pago (ahora solo hay 1 vale por pago)
    const vale = await ValeCorporativo.findOne({
      where: { id_pago: id_referencia }
    });

    if (vale) {
      // Obtener información del pago para incluir datos del usuario
      const pago = await Pago.findByPk(id_referencia, {
        include: [{
          model: OrdenCompra,
          as: 'orden',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'email', 'cargo']
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
        representante: pago?.orden?.usuario ? {
          nombre: pago.orden.usuario.nombre || 'N/A',
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

  // Retornar JSON formateado con indentación de 2 espacios para legibilidad
  return JSON.stringify(datosQR, null, 2);
};

/**
 * Genera código único corto para identificación rápida
 */
const generarCodigoUnico = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CORP-${timestamp}-${random}`;
};

/**
 * Crear boleta corporativa (POST /api/boletas-corporativas)
 * Body: { tipo, id_referencia }
 */
const crearBoletaCorporativa = async (req, res) => {
  try {
    const { tipo, id_referencia } = req.body;

    // Validar campos requeridos
    if (!tipo || !id_referencia) {
      return res.status(400).json({ 
        message: 'Tipo e id_referencia son requeridos' 
      });
    }

    // Validar que el tipo sea válido
    if (!['funcion_privada', 'alquiler_sala', 'publicidad', 'vales_corporativos'].includes(tipo)) {
      return res.status(400).json({ 
        message: 'Tipo debe ser "funcion_privada", "alquiler_sala", "publicidad" o "vales_corporativos"' 
      });
    }

    // Verificar que la referencia exista
    if (tipo === 'funcion_privada') {
      const funcion = await Funcion.findByPk(id_referencia);
      if (!funcion) {
        return res.status(404).json({ message: 'Función privada no encontrada' });
      }
    } else if (tipo === 'alquiler_sala') {
      const alquiler = await AlquilerSala.findByPk(id_referencia);
      if (!alquiler) {
        return res.status(404).json({ message: 'Alquiler de sala no encontrado' });
      }
    } else if (tipo === 'publicidad') {
      const publicidad = await Publicidad.findByPk(id_referencia);
      if (!publicidad) {
        return res.status(404).json({ message: 'Publicidad no encontrada' });
      }
    } else if (tipo === 'vales_corporativos') {
      const vale = await ValeCorporativo.findByPk(id_referencia);
      if (!vale) {
        return res.status(404).json({ message: 'Vale corporativo no encontrado' });
      }
    }

    // Verificar si ya existe una boleta para esta referencia
    const boletaExistente = await BoletaCorporativa.findOne({
      where: { tipo, id_referencia }
    });

    if (boletaExistente) {
      return res.status(200).json(boletaExistente);
    }

    // Generar código único
    let codigoUnico;
    let existe = true;
    while (existe) {
      codigoUnico = generarCodigoUnico();
      const boletaDuplicada = await BoletaCorporativa.findOne({ 
        where: { codigo_qr: { [require('sequelize').Op.like]: `%${codigoUnico}%` } }
      });
      existe = !!boletaDuplicada;
    }

    // Generar datos QR con información completa en JSON
    const datosQR = await generarDatosQR(tipo, id_referencia, codigoUnico);

    // Crear boleta
    const boleta = await BoletaCorporativa.create({
      tipo,
      id_referencia,
      codigo_qr: datosQR, // Guardar el JSON completo
      estado: 'activa'
    });

    return res.status(201).json(boleta);
  } catch (error) {
    console.error('Error creando boleta corporativa:', error);
    return res.status(500).json({ 
      message: 'Error al crear boleta corporativa',
      error: error.message 
    });
  }
};

/**
 * Obtener boleta por código QR (GET /api/boletas-corporativas/:codigo_qr)
 */
const obtenerBoletaPorQR = async (req, res) => {
  try {
    const { codigo_qr } = req.params;

    const boleta = await BoletaCorporativa.findOne({
      where: { codigo_qr }
    });

    if (!boleta) {
      return res.status(404).json({ message: 'Boleta no encontrada' });
    }

    // Obtener detalles según el tipo
    let detalles;
    if (boleta.tipo === 'funcion_privada') {
      detalles = await Funcion.findByPk(boleta.id_referencia, {
        include: [
          {
            model: Pelicula,
            as: 'pelicula',
            attributes: ['titulo', 'genero', 'duracion']
          },
          {
            model: Sala,
            as: 'sala',
            attributes: ['nombre', 'tipo_sala', 'capacidad'],
            include: [{
              model: Sede,
              as: 'sede',
              attributes: ['nombre', 'direccion', 'ciudad']
            }]
          },
          {
            model: Usuario,
            as: 'clienteCorporativo',
            attributes: ['nombre', 'email']
          }
        ]
      });
    } else if (boleta.tipo === 'alquiler_sala') {
      detalles = await AlquilerSala.findByPk(boleta.id_referencia, {
        include: [
          {
            model: Sala,
            as: 'sala',
            attributes: ['nombre', 'tipo_sala', 'capacidad'],
            include: [{
              model: Sede,
              as: 'sede',
              attributes: ['nombre', 'direccion', 'ciudad']
            }]
          },
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'email']
          }
        ]
      });
    }

    return res.json({
      boleta,
      detalles
    });
  } catch (error) {
    console.error('Error obteniendo boleta:', error);
    return res.status(500).json({ 
      message: 'Error al obtener boleta',
      error: error.message 
    });
  }
};

/**
 * Marcar boleta como utilizada (PUT /api/boletas-corporativas/:codigo_qr/utilizar)
 */
const marcarBoletaUtilizada = async (req, res) => {
  try {
    const { codigo_qr } = req.params;

    const boleta = await BoletaCorporativa.findOne({
      where: { codigo_qr }
    });

    if (!boleta) {
      return res.status(404).json({ message: 'Boleta no encontrada' });
    }

    if (boleta.estado === 'utilizada') {
      return res.status(400).json({ message: 'Boleta ya fue utilizada' });
    }

    if (boleta.estado === 'cancelada') {
      return res.status(400).json({ message: 'Boleta está cancelada' });
    }

    boleta.estado = 'utilizada';
    await boleta.save();

    return res.json({ 
      message: 'Boleta marcada como utilizada',
      boleta 
    });
  } catch (error) {
    console.error('Error actualizando boleta:', error);
    return res.status(500).json({ 
      message: 'Error al actualizar boleta',
      error: error.message 
    });
  }
};

/**
 * Listar boletas del usuario autenticado (GET /api/boletas-corporativas/mis-boletas)
 */
const obtenerMisBoletas = async (req, res) => {
  try {
    const idUsuario = req.user.id;
    console.log('🔍 Buscando boletas para usuario:', idUsuario);

    // Obtener funciones privadas del usuario
    const funcionesPrivadas = await Funcion.findAll({
      where: { id_cliente_corporativo: idUsuario },
      attributes: ['id']
    });

    const idsFunciones = funcionesPrivadas.map(f => f.id);
    console.log('📋 IDs de funciones privadas:', idsFunciones);

    // Obtener alquileres del usuario
    const alquileres = await AlquilerSala.findAll({
      where: { id_usuario: idUsuario },
      attributes: ['id']
    });

    const idsAlquileres = alquileres.map(a => a.id);
    console.log('🏢 IDs de alquileres:', idsAlquileres);

    // Obtener publicidad del usuario
    const publicidadCampanas = await Publicidad.findAll({
      where: { id_usuario: idUsuario },
      attributes: ['id']
    });

    const idsPublicidad = publicidadCampanas.map(p => p.id);
    console.log('📺 IDs de publicidad:', idsPublicidad);

    // Obtener pagos del usuario (para vales corporativos)
    const { Pago } = require('../models');
    const { OrdenCompra } = require('../models');
    const pagos = await Pago.findAll({
      include: [{
        model: OrdenCompra,
        as: 'ordenCompra',
        where: { id_usuario: idUsuario },
        attributes: ['id', 'id_usuario']
      }],
      attributes: ['id']
    });

    const idsPagos = pagos.map(p => p.id);
    console.log('💰 IDs de pagos:', idsPagos);

    // Para vales, necesitamos buscar los IDs de los vales que tienen esos pagos
    const valesDelUsuario = await ValeCorporativo.findAll({
      where: { id_pago: idsPagos },
      attributes: ['id']
    });
    
    const idsVales = valesDelUsuario.map(v => v.id);
    console.log('🎟️ IDs de vales (por pagos del usuario):', idsVales);

    // Construir condiciones OR dinámicamente
    const whereConditions = [];
    
    if (idsFunciones.length > 0) {
      whereConditions.push({ tipo: 'funcion_privada', id_referencia: idsFunciones });
    }
    
    if (idsAlquileres.length > 0) {
      whereConditions.push({ tipo: 'alquiler_sala', id_referencia: idsAlquileres });
    }
    
    if (idsPublicidad.length > 0) {
      whereConditions.push({ tipo: 'publicidad', id_referencia: idsPublicidad });
    }
    
    // Para vales: usar los IDs de los vales (no los pagos) porque id_referencia apunta al vale
    if (idsVales.length > 0) {
      whereConditions.push({ tipo: 'vales_corporativos', id_referencia: idsVales });
    }

    console.log('🔎 Condiciones de búsqueda:', JSON.stringify(whereConditions, null, 2));

    // Si no hay ninguna condición, retornar array vacío
    if (whereConditions.length === 0) {
      console.log('⚠️ No hay condiciones de búsqueda, retornando array vacío');
      return res.json([]);
    }

    // Obtener boletas
    const boletas = await BoletaCorporativa.findAll({
      where: {
        [require('sequelize').Op.or]: whereConditions
      },
      order: [['fecha_emision', 'DESC']]
    });

    console.log(`✅ Encontradas ${boletas.length} boletas`);

    // Enriquecer con detalles
    const boletasConDetalles = await Promise.all(
      boletas.map(async (boleta) => {
        console.log(`📦 Procesando boleta ${boleta.id} tipo: ${boleta.tipo}`);
        let detalles;
        let vales = [];
        
        if (boleta.tipo === 'funcion_privada') {
          detalles = await Funcion.findByPk(boleta.id_referencia, {
            include: [
              { model: Pelicula, as: 'pelicula', attributes: ['titulo'] },
              { 
                model: Sala, 
                as: 'sala', 
                attributes: ['nombre', 'tipo_sala'],
                include: [{ model: Sede, as: 'sede', attributes: ['nombre'] }]
              }
            ]
          });
        } else if (boleta.tipo === 'alquiler_sala') {
          detalles = await AlquilerSala.findByPk(boleta.id_referencia, {
            include: [
              { 
                model: Sala, 
                as: 'sala', 
                attributes: ['nombre', 'tipo_sala'],
                include: [{ model: Sede, as: 'sede', attributes: ['nombre'] }]
              }
            ]
          });
        } else if (boleta.tipo === 'publicidad') {
          detalles = await Publicidad.findByPk(boleta.id_referencia, {
            attributes: ['id', 'cliente', 'tipo', 'fecha_inicio', 'fecha_fin', 'precio', 'descripcion', 'estado', 'archivo_publicidad'],
            include: [
              { 
                model: Sede, 
                as: 'sede', 
                attributes: ['nombre', 'ciudad']
              }
            ]
          });
        } else if (boleta.tipo === 'vales_corporativos') {
          console.log(`🎟️ Buscando vale con ID: ${boleta.id_referencia}`);
          
          // Para vales, id_referencia apunta directamente al vale
          const vale = await ValeCorporativo.findByPk(boleta.id_referencia, {
            attributes: ['id', 'codigo', 'tipo', 'valor', 'fecha_expiracion', 'usado', 'cantidad_usos', 'usos_disponibles', 'id_pago']
          });
          
          if (vale) {
            vales = [vale]; // Mantener como array para compatibilidad
            console.log(`✅ Vale encontrado: ${vale.codigo} con ${vale.usos_disponibles} usos disponibles`);
          } else {
            console.log(`⚠️ No se encontró vale con ID ${boleta.id_referencia}`);
          }
          
          // Obtener el pago asociado al vale
          const pago = vale ? await Pago.findByPk(vale.id_pago, {
            include: [{
              model: OrdenCompra,
              as: 'ordenCompra',
              attributes: ['id', 'fecha_compra', 'id_usuario']
            }],
            attributes: ['id', 'monto_total', 'fecha_pago']
          }) : null;
          
          console.log(`💰 Pago encontrado:`, pago ? `ID ${pago.id}, monto: ${pago.monto_total}, orden: ${pago.ordenCompra?.id}` : 'No encontrado');
          
          // Calcular monto correcto basado en cantidad de usos del vale
          const montoCalculado = vale ? (vale.cantidad_usos * 7.00) : 0;
          
          detalles = {
            tipo: 'vales_corporativos',
            cantidad_vales: vale ? 1 : 0,
            cantidad_usos: vale ? vale.cantidad_usos : 0,
            usos_disponibles: vale ? vale.usos_disponibles : 0,
            monto_total: montoCalculado, // Usar monto calculado en vez del pago
            monto_pago_original: pago?.monto_total, // Guardar el original por referencia
            fecha_compra: pago?.ordenCompra?.fecha_compra || pago?.fecha_pago,
            id_orden_compra: pago?.ordenCompra?.id || null, // Siempre incluir, aunque sea null
            id_usuario_orden: pago?.ordenCompra?.id_usuario || null // ID del usuario de la orden
          };
          
          console.log(`💵 Monto recalculado: ${montoCalculado} (original: ${pago?.monto_total}), orden: ${detalles.id_orden_compra}`);
        }

        const resultado = {
          ...boleta.toJSON(),
          detalles,
          vales: vales.length > 0 ? vales : undefined,
          id_pago_orden: detalles?.id_orden_compra // Exponer para fácil acceso en frontend
        };
        
        console.log(`✅ Boleta ${boleta.id} procesada con ${vales.length} vales`);
        
        return resultado;
      })
    );

    console.log(`📤 Retornando ${boletasConDetalles.length} boletas con detalles`);
    return res.json(boletasConDetalles);
  } catch (error) {
    console.error('Error obteniendo mis boletas:', error);
    return res.status(500).json({ 
      message: 'Error al obtener boletas',
      error: error.message 
    });
  }
};

/**
 * Obtener todas las boletas corporativas (Solo Admin)
 * GET /api/boletas-corporativas/admin/todas
 */
const obtenerTodasBoletasAdmin = async (req, res) => {
  try {
    // Obtener todas las boletas sin filtro de usuario
    const boletas = await BoletaCorporativa.findAll({
      order: [['fecha_emision', 'DESC']]
    });

    // Enriquecer con detalles
    const boletasConDetalles = await Promise.all(
      boletas.map(async (boleta) => {
        let detalles;
        
        if (boleta.tipo === 'funcion_privada') {
          detalles = await Funcion.findByPk(boleta.id_referencia, {
            attributes: ['id', 'fecha', 'hora_inicio', 'hora_fin', 'descripcion_evento', 'precio_corporativo'],
            include: [
              { model: Pelicula, as: 'pelicula', attributes: ['titulo', 'duracion'] },
              { 
                model: Sala, 
                as: 'sala', 
                attributes: ['nombre', 'tipo_sala'],
                include: [{ model: Sede, as: 'sede', attributes: ['nombre', 'ciudad'] }]
              },
              {
                model: Usuario,
                as: 'clienteCorporativo',
                attributes: ['nombre', 'email', 'representante', 'cargo', 'ruc']
              }
            ]
          });
        } else if (boleta.tipo === 'alquiler_sala') {
          detalles = await AlquilerSala.findByPk(boleta.id_referencia, {
            attributes: ['id', 'fecha', 'hora_inicio', 'hora_fin', 'descripcion_evento', 'precio'],
            include: [
              { 
                model: Sala, 
                as: 'sala', 
                attributes: ['nombre', 'tipo_sala', 'capacidad'],
                include: [{ model: Sede, as: 'sede', attributes: ['nombre', 'ciudad'] }]
              },
              {
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'email', 'representante', 'cargo', 'ruc']
              }
            ]
          });
        } else if (boleta.tipo === 'publicidad') {
          detalles = await Publicidad.findByPk(boleta.id_referencia, {
            attributes: ['id', 'cliente', 'tipo', 'fecha_inicio', 'fecha_fin', 'precio', 'descripcion', 'estado', 'archivo_publicidad'],
            include: [
              { 
                model: Sede, 
                as: 'sede', 
                attributes: ['nombre', 'ciudad']
              },
              {
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'email', 'representante', 'cargo', 'ruc']
              }
            ]
          });
        } else if (boleta.tipo === 'vales_corporativos') {
          detalles = await ValeCorporativo.findByPk(boleta.id_referencia, {
            attributes: ['id', 'codigo', 'tipo', 'valor', 'fecha_expiracion', 'usado', 'cantidad_usos', 'usos_disponibles', 'id_pago', 'id_orden_compra'],
            include: [
              {
                model: Pago,
                as: 'pago',
                required: false, // Opcional: permite que el vale no tenga pago
                attributes: ['id', 'monto_total', 'fecha_pago', 'id_metodo_pago'],
                include: [
                  {
                    model: MetodoPago,
                    as: 'metodoPago',
                    required: false,
                    attributes: ['id', 'nombre']
                  },
                  {
                    model: OrdenCompra,
                    as: 'ordenCompra',
                    required: false, // Opcional
                    attributes: ['id', 'id_usuario'],
                    include: [
                      {
                        model: Usuario,
                        as: 'usuario',
                        required: false, // Opcional
                        attributes: ['id', 'nombre', 'email', 'representante', 'cargo', 'ruc']
                      }
                    ]
                  }
                ]
              }
            ]
          });
        }

        return {
          ...boleta.toJSON(),
          detalles
        };
      })
    );

    return res.json(boletasConDetalles);
  } catch (error) {
    console.error('Error obteniendo todas las boletas (Admin):', error);
    return res.status(500).json({ 
      message: 'Error al obtener boletas',
      error: error.message 
    });
  }
};

module.exports = {
  crearBoletaCorporativa,
  obtenerBoletaPorQR,
  marcarBoletaUtilizada,
  obtenerMisBoletas,
  obtenerTodasBoletasAdmin
};
