const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});

// Control del logging
const shouldLogSQL =
  process.env.NODE_ENV === "test" && process.env.SHOW_SQL === "true";

// Si hay DATABASE_URL (Railway, Render, etc.), úsala directamente
// Si no, usa las variables separadas (desarrollo local)
let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: shouldLogSQL ? console.log : false,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: "postgres",
      logging: shouldLogSQL ? console.log : false, // 💡 solo muestra SQL si SHOW_SQL=true
    }
  );
}

module.exports = sequelize;
