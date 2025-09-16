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

    // 📌 Cliente corporativo (solo si es privada)
    id_cliente_corporativo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    es_privada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // 📌 Precio acordado para funciones privadas
    precio_corporativo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0.01,
        requeridoSiPrivada(value) {
          if (this.es_privada && (value === null || value === undefined)) {
            throw new Error(
              "El precio corporativo es obligatorio para funciones privadas"
            );
          }
        },
      },
    },

    // 📌 Pago asociado (solo si es privada y ya está pagada)
    id_pago: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // 📌 Claves foráneas principales
    id_pelicula: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    id_sala: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "funciones",
    timestamps: false,
  }
);

module.exports = Funcion;
