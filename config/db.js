const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

// 📌 Cargar el archivo .env correcto (normal o test)
dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});

// 📦 Configurar logging según entorno
// 👉 Por defecto, silenciado en test, visible en desarrollo si SHOW_SQL=true
const loggingEnabled =
  process.env.NODE_ENV === "test"
    ? process.env.SHOW_SQL === "true"
      ? console.log
      : false
    : console.log;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: loggingEnabled,
  }
);

module.exports = sequelize;
