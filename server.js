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

      // Sincronizar modelos sin modificar estructura de tablas existentes
      // alter: false asegura que no se modifiquen tablas en producción
      // Para cambios de esquema, ejecutar SQL manualmente en Supabase
      return sequelize
        .sync({ alter: false })
        .then(() => {
          console.log("📦 Modelos sincronizados (sin modificar estructura)");
          // Invalidar todas las sesiones al iniciar
          return invalidarTodasLasSesiones();
        })
        .catch((syncErr) => {
          console.error('⚠️ Error al sincronizar modelos:', syncErr);
          // Aun así intentamos seguir y ejecutar la invalidación
          return invalidarTodasLasSesiones();
        });
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
