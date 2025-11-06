/**
 * 🔄 SCRIPT DE RESTAURACIÓN DE DATOS
 * 
 * Restaura los datos desde un archivo de respaldo
 * en una base de datos nueva (nube).
 * 
 * IMPORTANTE: Ejecutar DESPUÉS de inicializar las tablas vacías
 * 
 * Uso: node scripts/restaurar-respaldo-completo.js respaldos/respaldo-completo-YYYY-MM-DD.json
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

async function restaurarRespaldo() {
    try {
        const archivoRespaldo = process.argv[2];

        if (!archivoRespaldo) {
            console.log('❌ Por favor proporciona la ruta del archivo de respaldo');
            console.log('Uso: node scripts/restaurar-respaldo-completo.js respaldos/respaldo-completo-YYYY-MM-DD.json');
            process.exit(1);
        }

        const rutaCompleta = path.isAbsolute(archivoRespaldo) 
            ? archivoRespaldo 
            : path.join(__dirname, '..', archivoRespaldo);

        if (!fs.existsSync(rutaCompleta)) {
            console.log(`❌ Archivo no encontrado: ${rutaCompleta}`);
            process.exit(1);
        }

        console.log('🔄 Iniciando restauración de datos...\n');
        console.log(`📂 Archivo: ${rutaCompleta}\n`);

        const respaldo = JSON.parse(fs.readFileSync(rutaCompleta, 'utf-8'));

        // Orden de restauración (respetando dependencias)
        const ordenTablas = [
            'sedes',
            'salas',
            'tarifas_salas',
            'peliculas',
            'funciones',
            'asientos_funcion',
            'tipos_tickets',
            'combos',
            'metodos_pago',
            'usuarios',
            'ordenes_compra',
            'ordenes_tickets',
            'ordenes_combos',
            'pagos',
            'tarifas_corporativas',
            'boletas_corporativas',
            'alquiler_salas',
            'publicidad'
        ];

        for (const tabla of ordenTablas) {
            const datos = respaldo[tabla];

            if (!datos || datos.length === 0) {
                console.log(`⏭️  ${tabla}: sin datos para restaurar`);
                continue;
            }

            try {
                // Desactivar restricciones temporalmente
                await sequelize.query('SET CONSTRAINTS ALL DEFERRED');

                // Insertar datos
                for (const registro of datos) {
                    const columnas = Object.keys(registro).join(', ');
                    const valores = Object.values(registro).map(v => {
                        if (v === null) return 'NULL';
                        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                        if (typeof v === 'boolean') return v ? 'true' : 'false';
                        if (v instanceof Date) return `'${v.toISOString()}'`;
                        return v;
                    }).join(', ');

                    await sequelize.query(
                        `INSERT INTO ${tabla} (${columnas}) VALUES (${valores}) ON CONFLICT DO NOTHING`
                    );
                }

                // Resetear secuencias
                await sequelize.query(`
                    SELECT setval(pg_get_serial_sequence('${tabla}', 'id'), 
                    COALESCE((SELECT MAX(id) FROM ${tabla}), 1), false)
                `);

                console.log(`✅ ${tabla}: ${datos.length} registros restaurados`);

            } catch (error) {
                console.log(`⚠️  ${tabla}: error - ${error.message}`);
            }
        }

        console.log('\n✅ Restauración completada exitosamente');
        
        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error al restaurar:', error);
        await sequelize.close();
        process.exit(1);
    }
}

restaurarRespaldo();
