const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Pago = sequelize.define(
  "Pago",
  {
    id_orden_compra: { type: DataTypes.INTEGER, allowNull: false },
    id_metodo_pago: { type: DataTypes.INTEGER, allowNull: false },

    monto_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },

    estado_pago: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "completado",
      validate: {
        isIn: [["pendiente", "completado", "fallido", "confirmado"]],
      },
    },

    fecha_pago: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

    // 🔧 Código QR generado para la orden
    codigo_qr: { type: DataTypes.TEXT, allowNull: true },

    // 🔧 Simulación de datos adicionales según método
    numero_tarjeta: { type: DataTypes.STRING(20), allowNull: true },
    codigo_aprobacion: { type: DataTypes.STRING(20), allowNull: true },
  },
  {
    tableName: "pagos",
    timestamps: false,
  }
);

module.exports = Pago;
