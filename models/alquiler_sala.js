const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AlquilerSala = sequelize.define('AlquilerSala', {
  id_sala: { type: DataTypes.INTEGER, allowNull: false },
  id_usuario: { type: DataTypes.INTEGER, allowNull: false },

  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora_inicio: { type: DataTypes.TIME, allowNull: false },
  hora_fin: { type: DataTypes.TIME, allowNull: false },

  descripcion_evento: { type: DataTypes.TEXT, allowNull: true },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  id_pago: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'alquiler_salas',
  timestamps: false
});

module.exports = AlquilerSala;