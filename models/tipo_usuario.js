const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// 📌 Modelo: Tipos de usuario (Ej: Niño, Adulto, Conadis)
const TipoUsuario = sequelize.define(
  "TipoUsuario",
  {
    nombre: { type: DataTypes.STRING(50), allowNull: false },
  },
  {
    tableName: "tipos_usuario",
    timestamps: false,
  }
);

module.exports = TipoUsuario;
