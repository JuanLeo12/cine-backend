const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Combo = sequelize.define(
  "Combo",
  {
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },
    imagen_url: { type: DataTypes.STRING(255), allowNull: true },
    tipo: {
      type: DataTypes.STRING(20),
      defaultValue: "combos",
      allowNull: true,
      validate: { isIn: [["popcorn", "bebidas", "combos"]] },
    },
    estado: {
      type: DataTypes.STRING(20),
      defaultValue: "activo",
      validate: { isIn: [["activo", "inactivo"]] },
    },
  },
  {
    tableName: "combos",
    timestamps: false,
  }
);

module.exports = Combo;