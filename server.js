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

      // Intentar sincronizar modelos con la base de datos en entorno de desarrollo
      // Esto aplicará cambios necesarios en las tablas según los modelos (alter)
      // En producción recomendamos mantener la gestión de migraciones fuera de la app.
      return sequelize
        .sync({ alter: true })
        .then(() => {
          console.log("📦 Tablas sincronizadas (sequelize.sync { alter: true })");
          // Invalidar todas las sesiones al iniciar
          return invalidarTodasLasSesiones();
        })
        .catch((syncErr) => {
          console.error('⚠️ Error al sincronizar tablas:', syncErr);
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
