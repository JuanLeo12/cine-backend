const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BoletaCorporativa = sequelize.define('BoletaCorporativa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['funcion_privada', 'alquiler_sala', 'publicidad', 'vales_corporativos']]
    },
    comment: 'Tipo de servicio corporativo'
  },
  id_referencia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de la función privada o alquiler de sala'
  },
  codigo_qr: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: false,
    comment: 'JSON con información completa del servicio y código QR único'
  },
  fecha_emision: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de emisión de la boleta'
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'activa',
    validate: {
      isIn: [['activa', 'utilizada', 'cancelada']]
    },
    comment: 'Estado de la boleta'
  }
}, {
  tableName: 'boletas_corporativas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = BoletaCorporativa;
