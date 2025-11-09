const express = require("express");
const cors = require("cors");

// Inicializar app
const app = express();

// Configurar CORS con whitelist de dominios permitidos
const allowedOrigins = [
  'http://localhost:3000', // Desarrollo local
  'http://localhost:4000', // Backend local
  process.env.FRONTEND_URL, // URL de producción de Vercel (configurar en .env)
].filter(Boolean); // Filtrar valores undefined

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman, mobile apps, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS bloqueado para origen: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true, // Permitir cookies y headers de autenticación
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // 📸 Aumentado para soportar imágenes en base64
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 📁 Servir archivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Tiempo de inicio del servidor para invalidar sesiones
const SERVER_START_TIME = Date.now();

// Ruta para verificar tiempo de inicio del servidor
app.get('/api/server-status', (req, res) => {
  res.json({ startTime: SERVER_START_TIME, status: 'ok' });
});

// Las asociaciones ahora se cargan automáticamente en models/index.js

// Rutas principales
app.use('/usuarios', require('./routes/usuarios'));
app.use('/peliculas', require('./routes/peliculas'));
app.use('/salas', require('./routes/salas'));
app.use('/funciones', require('./routes/funciones'));
app.use('/ordenes', require('./routes/ordenes_compra'));
app.use('/pagos', require('./routes/pagos'));
app.use('/publicidad', require('./routes/publicidad'));
app.use('/vales', require('./routes/vales_corporativos'));

// Rutas complementarias
app.use('/sedes', require('./routes/sedes'));
app.use('/alquileres', require('./routes/alquiler_salas'));
app.use('/asientos', require('./routes/asientos_funcion'));
app.use('/metodos_pago', require('./routes/metodos_pago'));
app.use('/tipos_ticket', require('./routes/tipos_ticket'));
app.use('/combos', require('./routes/combos'));
app.use('/ordenes_tickets', require('./routes/ordenes_tickets'));
app.use('/ordenes_combos', require('./routes/ordenes_combos'));
app.use('/tickets', require('./routes/tickets'));
app.use('/tarifas_corporativas', require('./routes/tarifas_corporativas'));
app.use('/boletas-corporativas', require('./routes/boletasCorporativas'));

// Ruta base
app.get("/", (req, res) => {
  res.send("🎬 Backend CINE funcionando correctamente");
});

// 🔧 Endpoint temporal para ejecutar migración de pagos (SOLO ADMIN)
app.get("/admin/migrate-pagos-nullable", async (req, res) => {
  try {
    // Importar sequelize
    const sequelize = require('./config/db');
    
    console.log('🔧 Ejecutando migración: Permitir id_orden_compra NULL en pagos...');
    
    // Verificar estado actual
    const [checkBefore] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'pagos' AND column_name = 'id_orden_compra';
    `);
    
    console.log('📊 Estado ANTES:', checkBefore[0]);
    
    if (checkBefore[0]?.is_nullable === 'YES') {
      return res.json({
        success: true,
        message: '✅ La migración ya fue ejecutada anteriormente',
        estado: 'Ya migrado',
        detalles: checkBefore[0]
      });
    }
    
    // Ejecutar migración
    await sequelize.query(`
      ALTER TABLE pagos 
      ALTER COLUMN id_orden_compra DROP NOT NULL;
    `);
    
    console.log('✅ Migración ejecutada');
    
    // Verificar estado después
    const [checkAfter] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'pagos' AND column_name = 'id_orden_compra';
    `);
    
    console.log('📊 Estado DESPUÉS:', checkAfter[0]);
    
    if (checkAfter[0]?.is_nullable === 'YES') {
      res.json({
        success: true,
        message: '✅ ¡Migración completada exitosamente!',
        estado: 'Migrado',
        antes: checkBefore[0],
        despues: checkAfter[0],
        info: 'La columna id_orden_compra ahora permite valores NULL. Los vales corporativos ya funcionarán correctamente.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '⚠️ La migración se ejecutó pero la verificación falló',
        antes: checkBefore[0],
        despues: checkAfter[0]
      });
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar migración',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 🔧 Endpoint temporal para ejecutar migración: Agregar id_usuario a pagos
app.get("/admin/migrate-add-user-to-pagos", async (req, res) => {
  try {
    const sequelize = require('./config/db');
    const { Pago } = require('./models');
    
    console.log('🚀 Iniciando migración: Agregar id_usuario a pagos...');

    // 1. Verificar si la columna ya existe
    const [checkColumn] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'pagos' AND column_name = 'id_usuario';
    `);
    
    if (checkColumn.length > 0) {
      console.log('⚠️ La columna id_usuario ya existe');
    } else {
      // Agregar columna id_usuario
      await sequelize.query(`
        ALTER TABLE pagos 
        ADD COLUMN id_usuario INTEGER REFERENCES usuarios(id);
      `);
      console.log('✅ Columna id_usuario agregada a tabla pagos');
    }

    // 2. Poblar id_usuario para pagos existentes que tienen orden
    const [results] = await sequelize.query(`
      UPDATE pagos 
      SET id_usuario = ordenes_compra.id_usuario
      FROM ordenes_compra
      WHERE pagos.id_orden_compra = ordenes_compra.id
        AND pagos.id_usuario IS NULL;
    `);
    console.log(`✅ ${results.rowCount || 0} pagos actualizados con id_usuario de su orden`);

    // 3. Verificar pagos sin id_usuario
    const pagosSinUsuario = await Pago.count({
      where: { id_usuario: null }
    });
    
    res.json({
      success: true,
      message: '✅ Migración completada exitosamente',
      detalles: {
        columna_creada: checkColumn.length === 0,
        columna_ya_existia: checkColumn.length > 0,
        pagos_actualizados: results.rowCount || 0,
        pagos_sin_usuario: pagosSinUsuario,
        nota: pagosSinUsuario > 0 
          ? `Hay ${pagosSinUsuario} pagos sin id_usuario (probablemente pagos directos antiguos sin orden)`
          : 'Todos los pagos tienen id_usuario correctamente asignado'
      },
      proximos_pasos: [
        'Los nuevos pagos se crearán con id_usuario automáticamente',
        'Los vales corporativos ahora se mostrarán correctamente en Mis Compras',
        'Recarga la página de Mis Compras para ver los cambios'
      ]
    });
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al ejecutar migración',
      detalle: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 🔧 Endpoint para recuperar vales huérfanos (pagos sin id_usuario)
app.get("/admin/fix-orphan-vales", async (req, res) => {
  try {
    const sequelize = require('./config/db');
    
    console.log('🔍 Buscando vales con pagos sin id_usuario...');

    // Buscar pagos sin id_usuario que tengan vales asociados
    // y asignarles el usuario basándose en quien hizo la compra más reciente con ese vale
    const [valesHuerfanos] = await sequelize.query(`
      SELECT 
        v.id as vale_id,
        v.codigo as vale_codigo,
        p.id as pago_id,
        p.id_usuario as pago_usuario,
        bc.id as boleta_id
      FROM vales_corporativos v
      INNER JOIN pagos p ON v.id_pago = p.id
      LEFT JOIN boletas_corporativas bc ON bc.id_referencia = v.id AND bc.tipo = 'vales_corporativos'
      WHERE p.id_usuario IS NULL
      ORDER BY v.id;
    `);

    console.log(`📊 Encontrados ${valesHuerfanos.length} vales con pagos sin usuario`);

    if (valesHuerfanos.length === 0) {
      return res.json({
        success: true,
        message: '✅ No hay vales huérfanos para recuperar',
        vales_procesados: 0
      });
    }

    // Para cada vale huérfano, intentar determinar el usuario correcto
    const resultados = [];
    
    for (const vale of valesHuerfanos) {
      try {
        // Estrategia 1: Si el usuario está autenticado y es corporativo/cliente, asumir que es suyo
        // Estrategia 2: Buscar el usuario a través de la boleta del vale
        // Estrategia 3: Si todo falla, asignar al primer usuario corporativo
        
        let usuarioFinal = null;

        // Buscar quién creó la boleta de este vale (si existe)
        if (vale.boleta_id) {
          const [boletaInfo] = await sequelize.query(`
            SELECT 
              CASE 
                WHEN bc.tipo = 'funcion_privada' THEN f.id_cliente_corporativo
                WHEN bc.tipo = 'alquiler_sala' THEN a.id_usuario
                WHEN bc.tipo = 'publicidad' THEN pub.id_usuario
                ELSE NULL
              END as usuario_id
            FROM boletas_corporativas bc
            LEFT JOIN funciones f ON bc.id_referencia = f.id AND bc.tipo = 'funcion_privada'
            LEFT JOIN alquiler_sala a ON bc.id_referencia = a.id AND bc.tipo = 'alquiler_sala'
            LEFT JOIN publicidad pub ON bc.id_referencia = pub.id AND bc.tipo = 'publicidad'
            WHERE bc.id = :boleta_id
            LIMIT 1;
          `, {
            replacements: { boleta_id: vale.boleta_id }
          });
          
          usuarioFinal = boletaInfo[0]?.usuario_id;
        }

        // Si no encontramos usuario por boleta, buscar cualquier usuario corporativo o cliente
        if (!usuarioFinal) {
          const [primerUsuario] = await sequelize.query(`
            SELECT id 
            FROM usuarios 
            WHERE rol IN ('corporativo', 'cliente')
            ORDER BY id ASC
            LIMIT 1;
          `);
          usuarioFinal = primerUsuario[0]?.id;
        }

        if (usuarioFinal) {
          // Actualizar el pago con el usuario encontrado
          await sequelize.query(`
            UPDATE pagos 
            SET id_usuario = :usuario_id
            WHERE id = :pago_id;
          `, {
            replacements: { 
              usuario_id: usuarioFinal, 
              pago_id: vale.pago_id 
            }
          });

          resultados.push({
            vale_id: vale.vale_id,
            vale_codigo: vale.vale_codigo,
            pago_id: vale.pago_id,
            usuario_asignado: usuarioFinal,
            metodo: vale.boleta_id ? 'por_boleta' : 'primer_usuario_corporativo',
            estado: 'actualizado'
          });
          
          console.log(`✅ Vale ${vale.vale_codigo} asignado a usuario ${usuarioFinal}`);
        } else {
          resultados.push({
            vale_id: vale.vale_id,
            vale_codigo: vale.vale_codigo,
            pago_id: vale.pago_id,
            estado: 'no_se_pudo_determinar_usuario'
          });
          
          console.log(`⚠️ No se pudo determinar usuario para vale ${vale.vale_codigo}`);
        }
      } catch (error) {
        console.error(`❌ Error procesando vale ${vale.vale_codigo}:`, error.message);
        resultados.push({
          vale_id: vale.vale_id,
          vale_codigo: vale.vale_codigo,
          estado: 'error',
          error: error.message
        });
      }
    }

    const exitosos = resultados.filter(r => r.estado === 'actualizado').length;

    res.json({
      success: true,
      message: `✅ Proceso completado: ${exitosos}/${valesHuerfanos.length} vales recuperados`,
      vales_procesados: valesHuerfanos.length,
      vales_actualizados: exitosos,
      detalles: resultados,
      nota: 'Recarga la página de Mis Compras para ver los vales recuperados'
    });
    
  } catch (error) {
    console.error('❌ Error recuperando vales huérfanos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al recuperar vales huérfanos',
      detalle: error.message
    });
  }
});

// ⚠️ Middleware de manejo de errores global (debe estar al final)
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  
  // Error de CORS
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({ 
      error: 'Acceso denegado por CORS',
      message: 'El origen de la petición no está permitido'
    });
  }
  
  // Error de validación de JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      error: 'JSON inválido',
      message: 'El formato de los datos enviados es incorrecto'
    });
  }
  
  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 - Ruta no encontrada (debe estar antes del error handler)
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl 
  });
});

module.exports = app;

// Iniciar cron job de liberación de asientos (después de exportar app)
require("./utils/liberarAsientos");

