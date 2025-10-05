const cron = require("node-cron");
const { AsientoFuncion } = require("../models");
const { Op } = require("sequelize");

// 🚫 Evitar ejecutar el cron en modo test
if (process.env.NODE_ENV !== "test") {
  // ⏰ Ejecutar cada minuto
  cron.schedule("* * * * *", async () => {
    try {
      const ahora = new Date();

      const vencidos = await AsientoFuncion.findAll({
        where: {
          estado: "bloqueado",
          bloqueo_expira_en: { [Op.lt]: ahora },
        },
      });

      if (vencidos.length > 0) {
        for (const asiento of vencidos) {
          await asiento.update({
            estado: "libre",
            id_usuario_bloqueo: null,
            bloqueo_expira_en: null,
          });
        }
        console.log(`🟢 ${vencidos.length} asientos liberados automáticamente`);
      }
    } catch (error) {
      console.error("❌ Error liberando asientos:", error);
    }
  });
}
