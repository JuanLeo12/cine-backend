const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ValeCorporativo = sequelize.define(
  "ValeCorporativo",
  {
    codigo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { isIn: [["entrada", "combo"]] },
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },
    fecha_expiracion: { type: DataTypes.DATEONLY, allowNull: false },
    usado: { type: DataTypes.BOOLEAN, defaultValue: false },
    id_pago: { type: DataTypes.INTEGER, allowNull: true },
    id_orden_compra: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "vales_corporativos",
    timestamps: false,
  }
);

module.exports = ValeCorporativo;
