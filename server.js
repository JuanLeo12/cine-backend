const sequelize = require("./config/db");
const app = require("./app");
const { invalidarTodasLasSesiones } = require("./utils/invalidarSesiones");

// Iniciar cron job para liberar asientos
require("./utils/liberarAsientos");

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== "test") {
  sequelize
    .authenticate()
    .then(() => {
      console.log("✅ Conexión a PostgreSQL exitosa");
      console.log("📦 Usando tablas existentes (sin sincronización)");
      
      // Invalidar todas las sesiones al iniciar
      return invalidarTodasLasSesiones();
    })
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`🔒 Sesiones anteriores invalidadas - usuarios deben volver a iniciar sesión`);
      });
    })
    .catch((err) => {
      console.error("❌ Error al conectar:", err);
    });
}
