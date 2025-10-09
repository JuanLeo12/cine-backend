const sequelize = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== "test") {
  sequelize
    .authenticate()
    .then(() => {
      console.log("✅ Conexión a PostgreSQL exitosa");

      return sequelize.sync({ alter: true }); // Sincroniza modelos con la base de datos
    })
    .then(() => {
      console.log("📦 Tablas sincronizadas");
      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("❌ Error al conectar o sincronizar:", err);
    });
}
