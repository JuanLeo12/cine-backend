const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OrdenTicket = sequelize.define(
  "OrdenTicket",
  {
    id_orden_compra: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_tipo_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },
    descuento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
      validate: {
        min: 0,
        esMenorQuePrecio(value) {
          if (value && parseFloat(value) > parseFloat(this.precio_unitario)) {
            throw new Error(
              "El descuento no puede ser mayor que el precio unitario"
            );
          }
        },
      },
    },
  },
  {
    tableName: "ordenes_tickets",
    timestamps: false,
  }
);

module.exports = OrdenTicket;