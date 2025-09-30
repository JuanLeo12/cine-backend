const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AsientoFuncion = sequelize.define(
  "AsientoFuncion",
  {
    id_funcion: { type: DataTypes.INTEGER, allowNull: false },
    fila: {
      type: DataTypes.STRING(2),
      allowNull: false,
      set(value) {
        this.setDataValue("fila", value.toUpperCase()); // siempre en mayúsculas
      },
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "libre",
      validate: { isIn: [["libre", "bloqueado", "ocupado"]] },
    },
    id_usuario_bloqueo: { type: DataTypes.INTEGER, allowNull: true },
    bloqueo_expira_en: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "asientos_funcion",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["id_funcion", "fila", "numero"],
      },
    ],
  }
);

module.exports = AsientoFuncion;
