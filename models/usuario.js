const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const sequelize = require("../config/db");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

const Usuario = sequelize.define(
  "Usuario",
  {
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
    rol: { type: DataTypes.STRING(20), defaultValue: "cliente" },
    fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "usuarios",
    timestamps: false, // para evitar conflicto con createdAt/updatedAt
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
        }
      },
    },
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      withPassword: { attributes: { include: ["password"] } },
    },
  }
);

Usuario.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = Usuario;
