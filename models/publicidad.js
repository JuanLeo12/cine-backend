const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Publicidad = sequelize.define(
  "Publicidad",
  {
    cliente: { type: DataTypes.STRING(100), allowNull: false },
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [
          [
            "pantalla",
            "banner",
            "stand",
            "modulo",
            "activacion",
            "popcorn",
            "tv_wall",
          ],
        ],
      },
    },
    fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },
    descripcion: { type: DataTypes.TEXT },
    imagen_url: { type: DataTypes.STRING(255) },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pendiente",
      validate: {
        isIn: [["pendiente", "aprobada", "activa", "finalizada", "rechazada"]],
      },
    },
    visible: { type: DataTypes.BOOLEAN, defaultValue: true },
    id_usuario: { type: DataTypes.INTEGER },
    id_sede: { type: DataTypes.INTEGER },
    id_pago: { type: DataTypes.INTEGER },
    id_admin_aprobador: { type: DataTypes.INTEGER },
    fecha_aprobacion: { type: DataTypes.DATE },
  },
  {
    tableName: "publicidad",
    timestamps: false,
  }
);

module.exports = Publicidad;
