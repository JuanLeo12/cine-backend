const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Sede = sequelize.define(
  "Sede",
  {
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    direccion: { type: DataTypes.STRING(255), allowNull: false },
    ciudad: { type: DataTypes.STRING(100), allowNull: false },
  },
  {
    tableName: "sedes",
    timestamps: false,
  }
);

module.exports = Sede;
