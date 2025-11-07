const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");

// Configurar credenciales públicas de Railway temporalmente
process.env.DATABASE_URL = "postgresql://postgres:DBZrIdESMKsKHHEIKbEpIILwtYGwqlsJ@switchback.proxy.rlwy.net:56790/railway";

// Importar modelos (ahora usarán la DATABASE_URL que acabamos de configurar)
const models = require("./models");
const sequelize = require("./config/db");

async function restaurarRespaldo() {
  try {
    console.log("🔄 Conectando a Railway (conexión pública)...");
    await sequelize.authenticate();
    console.log("✅ Conexión exitosa\n");

    // Leer archivo de respaldo
    const backupFile = "./respaldos/respaldo-completo-2025-11-07T00-03-57-fixed.json";
    console.log(`📖 Leyendo ${backupFile}...`);
    const respaldo = JSON.parse(fs.readFileSync(backupFile, "utf8"));
    
    console.log(`✅ Respaldo cargado: ${respaldo.descripcion}`);
    console.log(`📅 Fecha: ${new Date(respaldo.fecha_creacion).toLocaleString()}\n`);

    console.log("📦 Restaurando tablas...\n");

    // Orden de restauración (respetando dependencias)
    const orden = [
      { tabla: "sedes", modelo: models.Sede },
      { tabla: "salas", modelo: models.Sala },
      { tabla: "peliculas", modelo: models.Pelicula },
      { tabla: "usuarios", modelo: models.Usuario },
      { tabla: "funciones", modelo: models.Funcion, limpiar: (datos) => {
        // Eliminar referencias a clientes corporativos que no existen
        return datos.map(f => ({ ...f, id_cliente_corporativo: null }));
      }},
      { tabla: "tipos_ticket", modelo: models.TipoTicket },
      { tabla: "asientos_funcion", modelo: models.AsientoFuncion },
      { tabla: "combos", modelo: models.Combo },
      { tabla: "metodos_pago", modelo: models.MetodoPago },
      { tabla: "ordenes_compra", modelo: models.OrdenCompra },
      { tabla: "ordenes_tickets", modelo: models.OrdenTicket },
      { tabla: "ordenes_combos", modelo: models.OrdenCombo },
      { tabla: "tickets", modelo: models.Ticket },
      { tabla: "pagos", modelo: models.Pago },
      { tabla: "vales_corporativos", modelo: models.ValeCorporativo },
      { tabla: "boletas_corporativas", modelo: models.BoletaCorporativa },
      { tabla: "alquileres_salas", modelo: models.AlquilerSala },
      { tabla: "publicidad", modelo: models.Publicidad },
      { tabla: "tarifas_corporativas", modelo: models.TarifaCorporativa },
    ];

    let totalRegistros = 0;

    for (const { tabla, modelo, limpiar } of orden) {
      let datos = respaldo.tablas[tabla];

      if (!datos || datos.length === 0) {
        console.log(`⏭️  ${tabla.padEnd(30)} Sin datos`);
        continue;
      }

      // Aplicar función de limpieza si existe
      if (limpiar) {
        datos = limpiar(datos);
      }

      try {
        await modelo.bulkCreate(datos, {
          ignoreDuplicates: true,
          validate: false,
        });
        console.log(`✅ ${tabla.padEnd(30)} ${datos.length} registros restaurados`);
        totalRegistros += datos.length;
      } catch (error) {
        console.log(`⚠️  ${tabla.padEnd(30)} Error: ${error.message}`);
      }
    }

    // Actualizar secuencias
    console.log("\n🔄 Actualizando secuencias...");
    const tablas = [
      "sedes", "salas", "peliculas", "funciones", "tipos_ticket",
      "asientos_funcion", "usuarios", "combos", "metodos_pago",
      "ordenes_compra", "ordenes_tickets", "ordenes_combos",
      "tickets", "pagos", "vales_corporativos", "boletas_corporativas",
      "alquileres_salas", "publicidad", "tarifas_corporativas"
    ];

    for (const tabla of tablas) {
      try {
        await sequelize.query(
          `SELECT setval(pg_get_serial_sequence('${tabla}', 'id'), (SELECT COALESCE(MAX(id), 1) FROM ${tabla}), true);`
        );
      } catch (e) {
        // Ignorar errores de secuencias (algunas tablas no tienen id autoincremental)
      }
    }
    console.log("✅ Secuencias actualizadas\n");

    console.log("=".repeat(60));
    console.log("📦 RESTAURACIÓN COMPLETADA");
    console.log("=".repeat(60));
    console.log(`📊 Total de registros restaurados: ${totalRegistros}`);
    console.log("=".repeat(60));
    console.log("\n✅ Todos tus datos han sido restaurados en Railway");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error restaurando respaldo:", error);
    process.exit(1);
  }
}

restaurarRespaldo();
