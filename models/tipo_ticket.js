const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// 📌 Modelo: Tipos de ticket (Ej: Niño, Adulto, Adulto Mayor y Conadis)
const TipoTicket = sequelize.define(
  "TipoTicket",
  {
    nombre: { type: DataTypes.STRING(50), allowNull: false },
    estado: {
      type: DataTypes.STRING(20),
      defaultValue: "activo",
      validate: {
        isIn: [["activo", "inactivo"]],
      },
    },
  },
  {
    tableName: "tipo_ticket",
    timestamps: false,
  }
);

module.exports = TipoTicket;
