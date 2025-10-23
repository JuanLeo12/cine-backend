const cron = require("node-cron");
const { AsientoFuncion } = require("../models");
const { Op } = require("sequelize");

// 🚫 Evitar ejecutar el cron en modo test
if (process.env.NODE_ENV !== "test") {
  // ⏰ Ejecutar cada minuto para liberar asientos bloqueados vencidos
  cron.schedule("* * * * *", async () => {
    try {
      const ahora = new Date();

      // Buscar asientos bloqueados cuyo tiempo de bloqueo haya expirado
      const vencidos = await AsientoFuncion.findAll({
        where: {
          estado: "bloqueado",
          bloqueo_expira_en: { [Op.lt]: ahora },
        },
      });

      if (vencidos.length > 0) {
        // Liberar asientos automáticamente (eliminar registro)
        for (const asiento of vencidos) {
          await asiento.destroy();
        }
        console.log(`🟢 ${vencidos.length} asiento(s) liberado(s) automáticamente (bloqueo expirado)`);
      }
    } catch (error) {
      console.error("❌ Error liberando asientos:", error);
    }
  });
  
  console.log("✅ Cron job iniciado: liberación automática de asientos cada 1 minuto");
}
