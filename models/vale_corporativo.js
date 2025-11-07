const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ValeCorporativo = sequelize.define(
  "ValeCorporativo",
  {
    codigo: { type: DataTypes.STRING(50), allowNull: false, unique: true }, // 🔒 único
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { isIn: [["entrada", "combo"]] },
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.01 },
      comment: "Porcentaje de descuento (ej: 15.00 = 15%)"
    },
    fecha_expiracion: { type: DataTypes.DATEONLY, allowNull: false },
    cantidad_usos: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1 }
    }, // Cantidad total de usos del vale
    usos_disponibles: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      defaultValue: 1,
      validate: { min: 0 }
    }, // Usos restantes
    usado: { type: DataTypes.BOOLEAN, defaultValue: false }, // Se marca true cuando usos_disponibles = 0
    id_pago: { type: DataTypes.INTEGER, allowNull: true },
    id_orden_compra: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "vales_corporativos",
    timestamps: false,
  }
);

module.exports = ValeCorporativo;