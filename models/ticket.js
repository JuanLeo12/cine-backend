const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Ticket = sequelize.define(
  "Ticket",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_orden_ticket: { type: DataTypes.INTEGER, allowNull: false },
    id_asiento: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "tickets",
    timestamps: false,
    indexes: [{ unique: true, fields: ["id_asiento"] }],
  }
);

module.exports = Ticket;
