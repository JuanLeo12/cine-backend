const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// 📌 Modelo creado según script SQL original (tabla: tipos_usuario)
const TipoUsuario = sequelize.define('TipoUsuario', {
  nombre: { type: DataTypes.STRING(50), allowNull: false } // 📌 Ej: Niño, Adulto, Conadis
}, {
  tableName: 'tipos_usuario',
  timestamps: false
});

module.exports = TipoUsuario;