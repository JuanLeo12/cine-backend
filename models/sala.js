const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Sala = sequelize.define('Sala', {
  nombre: { type: DataTypes.STRING(50), allowNull: false },
  filas: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  columnas: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  id_sede: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'salas',
  timestamps: false
});

module.exports = Sala;