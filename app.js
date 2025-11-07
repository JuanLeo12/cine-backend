const express = require("express");
const cors = require("cors");
require("dotenv").config();

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

