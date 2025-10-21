const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// 📌 Modelo: Tipos de ticket (Ej: Niño, Adulto, Adulto Mayor y Conadis)
const TipoTicket = sequelize.define(
  "TipoTicket",
  {
    nombre: { type: DataTypes.STRING(50), allowNull: false },
  },
  {
    tableName: "tipo_ticket",
    timestamps: false,
  }
);

module.exports = TipoTicket;
