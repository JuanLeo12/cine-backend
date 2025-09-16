const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// 📌 Modelo creado según script SQL original (tabla: metodos_pago)
const MetodoPago = sequelize.define('MetodoPago', {
  nombre: { type: DataTypes.STRING(50), allowNull: false } // 📌 Ej: Yape, Tarjeta, Efectivo
}, {
  tableName: 'metodos_pago',
  timestamps: false
});

module.exports = MetodoPago;