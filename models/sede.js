const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// 📌 Modelo creado según script SQL original (tabla: sedes)
const Sede = sequelize.define('Sede', {
  nombre: { type: DataTypes.STRING(100), allowNull: false },     // 📌 Nombre de la sede
  direccion: { type: DataTypes.STRING(255), allowNull: false },  // 📌 Dirección completa
  ciudad: { type: DataTypes.STRING(100), allowNull: false }      // 📌 Ciudad donde se ubica
}, {
  tableName: 'sedes',
  timestamps: false
});

module.exports = Sede;