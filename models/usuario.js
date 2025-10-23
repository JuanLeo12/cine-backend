const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const sequelize = require("../config/db");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

const Usuario = sequelize.define(
  "Usuario",
  {
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    apellido: { type: DataTypes.STRING(100) },
    dni: { type: DataTypes.STRING(8), unique: true, allowNull: true },
    ruc: { type: DataTypes.STRING(11), unique: true, allowNull: true },
    representante: { type: DataTypes.STRING(100), allowNull: true },
    cargo: { type: DataTypes.STRING(100), allowNull: true },
    telefono: { 
      type: DataTypes.STRING(20),
      validate: {
        is: {
          args: /^(\d{7}|\d{9})$/,
          msg: "El teléfono debe tener 7 dígitos (fijo) o 9 dígitos (celular)"
        }
      }
    },
    direccion: { type: DataTypes.STRING(255) },
    fecha_nacimiento: { type: DataTypes.DATEONLY },
    genero: { type: DataTypes.STRING(20) },
    foto_perfil: { type: DataTypes.STRING(255) },
    estado: { type: DataTypes.STRING(20), defaultValue: "activo" },
    ultimo_acceso: { type: DataTypes.DATE },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
    rol: { type: DataTypes.STRING(20), defaultValue: "cliente" },
    fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    token_version: { type: DataTypes.INTEGER, defaultValue: 0 }, // 🔑 invalida tokens viejos
  },
  {
    tableName: "usuarios",
    timestamps: false,
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

// Método de comparación
Usuario.prototype.validarPassword = function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password);
};

// Ocultar password en JSON
Usuario.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = Usuario;
