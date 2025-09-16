const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OrdenCombo = sequelize.define(
  "OrdenCombo",
  {
    id_orden_compra: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_combo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    tableName: "ordenes_combos",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["id_orden_compra", "id_combo"],
      },
    ],
  }
);

module.exports = OrdenCombo;
