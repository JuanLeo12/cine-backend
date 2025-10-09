const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./utils/liberarAsientos");

// Inicializar app
const app = express();
app.use(cors());
app.use(express.json());

// Importar asociaciones y modelos
require("./models/associations");

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
app.use('/tipos_usuario', require('./routes/tipos_usuario'));
app.use('/combos', require('./routes/combos'));
app.use('/ordenes_tickets', require('./routes/ordenes_tickets'));
app.use('/ordenes_combos', require('./routes/ordenes_combos'));
app.use('/tickets', require('./routes/tickets'));
app.use('/tarifas_corporativas', require('./routes/tarifas_corporativas'));

// Ruta base
app.get("/", (req, res) => {
  res.send("🎬 Backend CINE funcionando correctamente");
});

module.exports = app;
