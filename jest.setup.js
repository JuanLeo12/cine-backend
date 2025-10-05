// jest.setup.js
require("dotenv").config({ path: ".env.test" });
const sequelize = require("./config/db");

beforeAll(async () => {
  // Conexión + sincronización limpia antes de correr tests
  await sequelize.authenticate();
  await sequelize.sync({ force: true }); // ⚠️ en test siempre limpio
});

afterAll(async () => {
  // Cerrar conexión después de las pruebas
  await sequelize.close();
});
