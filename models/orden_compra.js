const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OrdenCompra = sequelize.define(
  "OrdenCompra",
  {
    fecha_compra: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_funcion: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        async tieneSentido(value) {
          if (!value) {
            const OrdenTicket = require("./orden_ticket");
            const tickets = await OrdenTicket.findAll({
              where: { id_orden_compra: this.id },
            });
            if (tickets.length > 0) {
              throw new Error(
                "Una orden con tickets debe tener una función asociada"
              );
            }
          }
        },
      },
    },
    monto_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
      validate: { min: 0 },
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "pagada", "cancelada"),
      defaultValue: "pendiente",
      allowNull: false,
    },
  },
  {
    tableName: "ordenes_compra",
    timestamps: false,
  }
);

module.exports = OrdenCompra;