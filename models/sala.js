const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Sala = sequelize.define(
  "Sala",
  {
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { notEmpty: true },
    },
    tipo_sala: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "2D",
      validate: { isIn: [["2D", "3D", "4DX", "Xtreme"]] },
    },
    filas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    columnas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    id_sede: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING(20),
      defaultValue: "activa",
      validate: { isIn: [["activa", "inactiva"]] },
    },
  },
  {
    tableName: "salas",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["id_sede", "nombre"], // evita duplicados dentro de una sede
      },
    ],
  }
);

module.exports = Sala;