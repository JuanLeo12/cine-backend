const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Sede = sequelize.define(
  "Sede",
  {
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    direccion: { type: DataTypes.STRING(255), allowNull: false },
    ciudad: { type: DataTypes.STRING(100), allowNull: false },
    telefono: { 
      type: DataTypes.STRING(9), 
      allowNull: true 
    },
    imagen_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado: {
      type: DataTypes.STRING(20),
      defaultValue: "activo",
      validate: {
        isIn: [["activo", "inactivo"]],
      },
    },
  },
  {
    tableName: "sedes",
    timestamps: false,
  }
);

module.exports = Sede;
