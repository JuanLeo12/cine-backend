const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Pago = sequelize.define(
  "Pago",
  {
    id_orden_compra: { type: DataTypes.INTEGER, allowNull: false },
    id_metodo_pago: { type: DataTypes.INTEGER, allowNull: false },

    monto_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

    estado_pago: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "completado",
      validate: {
        isIn: [["pendiente", "completado", "fallido"]],
      },
    },

    fecha_pago: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    // 🔧 Campos agregados para simular lógica de pago según método
    numero_tarjeta: { type: DataTypes.STRING(20), allowNull: true }, // Últimos dígitos
    codigo_aprobacion: { type: DataTypes.STRING(20), allowNull: true }, // Código Yape
  },
  {
    tableName: "pagos",
    timestamps: false,
  }
);

module.exports = Pago;
