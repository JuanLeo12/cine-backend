const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// 📌 Modelo ajustado según script SQL original (tabla: peliculas)
const Pelicula = sequelize.define(
  "Pelicula",
  {
    titulo: { type: DataTypes.STRING(100), allowNull: false }, // 📌 Título de la película
    genero: { type: DataTypes.STRING(50) }, // 📌 Género (Ej: Acción, Drama)
    clasificacion: { type: DataTypes.STRING(10) }, // 📌 Clasificación (Ej: PG-13)
    sinopsis: { type: DataTypes.TEXT }, // 📌 Descripción larga
    imagen_url: { type: DataTypes.STRING(255) }, // 📌 URL de imagen
    fecha_estreno: { type: DataTypes.DATE }, // 📌 Fecha de estreno
    duracion: {
      type: DataTypes.INTEGER,
      validate: { min: 1 },
    },
    estado: {
      type: DataTypes.STRING(20),
      defaultValue: "activa",
      validate: { isIn: [["activa", "inactiva"]] },
    },
  },
  {
    tableName: "peliculas",
    timestamps: false,
  }
);

module.exports = Pelicula;
