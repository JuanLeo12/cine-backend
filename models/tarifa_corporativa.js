const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TarifaCorporativa = sequelize.define(
  "TarifaCorporativa",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_cliente_corporativo: { type: DataTypes.INTEGER, allowNull: false },
    id_tipo_usuario: { type: DataTypes.INTEGER, allowNull: false },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },
  },
  {
    tableName: "tarifas_corporativas",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["id_cliente_corporativo", "id_tipo_usuario"] },
    ],
  }
);

module.exports = TarifaCorporativa;