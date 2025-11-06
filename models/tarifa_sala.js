const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/**
 * Modelo: Tarifas por Tipo de Sala
 * Define el precio de cada tipo de ticket según el tipo de sala
 */
const TarifaSala = sequelize.define(
  "TarifaSala",
  {
    id_tipo_ticket: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tipo_ticket",
        key: "id",
      },
    },
    tipo_sala: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["2D", "3D", "4DX", "Xtreme"]],
      },
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  },
  {
    tableName: "tarifas_sala",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["id_tipo_ticket", "tipo_sala"], // Una tarifa por combinación
      },
    ],
  }
);

module.exports = TarifaSala;
