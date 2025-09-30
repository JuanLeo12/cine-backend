const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Funcion = sequelize.define(
  "Funcion",
  {
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    es_privada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    id_cliente_corporativo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    precio_corporativo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0.01,
      },
    },
    id_pago: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_pelicula: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_sala: {
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
    tableName: "funciones",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["id_sala", "fecha", "hora"],
      },
    ],
  }
);

module.exports = Funcion;
