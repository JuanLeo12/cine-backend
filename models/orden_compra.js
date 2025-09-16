const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OrdenCompra = sequelize.define('OrdenCompra', {
  fecha_compra: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },

  id_usuario: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },

  // 📌 Ahora opcional: solo obligatorio si hay tickets en la orden
  id_funcion: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    validate: {
      // Validación condicional: si no hay función, debe ser solo combos
      async tieneSentido(value) {
        if (!value) {
          // Cargamos el modelo aquí para evitar dependencias circulares
          const OrdenTicket = require('./orden_ticket');
          const tickets = await OrdenTicket.findAll({
            where: { id_orden_compra: this.id }
          });
          if (tickets.length > 0) {
            throw new Error('Una orden con tickets debe tener una función asociada');
          }
        }
      }
    }
  }
}, {
  tableName: 'ordenes_compra',
  timestamps: false
});

module.exports = OrdenCompra;