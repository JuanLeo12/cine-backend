const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Pelicula = sequelize.define(
  "Pelicula",
  {
    titulo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: "El título es obligatorio" } },
    },
    genero: { type: DataTypes.STRING(50) },
    clasificacion: { type: DataTypes.STRING(10) },
    sinopsis: { type: DataTypes.TEXT },
    imagen_url: { type: DataTypes.STRING(550) },
    fecha_estreno: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: { isDate: { msg: "La fecha de estreno no es válida" } },
    },
    duracion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: "La duración debe ser mayor que 0" },
      },
    },
    estado: {
      type: DataTypes.STRING(20),
      defaultValue: "activa",
      validate: {
        isIn: {
          args: [["activa", "inactiva"]],
          msg: "El estado debe ser 'activa' o 'inactiva'",
        },
      },
    },
    // 🔹 Nuevo campo para distinguir cartelera vs. estrenos
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "cartelera",
      validate: {
        isIn: {
          args: [["cartelera", "proxEstreno"]],
          msg: "El tipo debe ser 'cartelera' o 'proxEstreno'",
        },
      },
    },
  },
  {
    tableName: "peliculas",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["titulo", "fecha_estreno"], // 📌 evita duplicados
      },
    ],
  }
);

module.exports = Pelicula;
