/**
 * 📦 SCRIPT DE RESPALDO COMPLETO DE BASE DE DATOS
 * 
 * Crea un respaldo completo de todas las tablas con datos
 * para restaurar en la nube manteniendo toda la información actual.
 * 
 * Uso: node scripts/crear-respaldo-completo.js
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

const RESPALDO_DIR = path.join(__dirname, '..', 'respaldos');

async function crearRespaldo() {
    try {
        console.log('🔄 Iniciando respaldo completo de la base de datos...\n');

        // Crear directorio si no existe
        if (!fs.existsSync(RESPALDO_DIR)) {
            fs.mkdirSync(RESPALDO_DIR, { recursive: true });
        }

        // Tablas en orden de dependencias
        const tablas = [
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

        const fecha = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const archivo = path.join(RESPALDO_DIR, `respaldo-completo-${fecha}.json`);

        const respaldo = {};

        // Extraer datos de cada tabla
        for (const tabla of tablas) {
            try {
                const [resultados] = await sequelize.query(`SELECT * FROM ${tabla}`);
                respaldo[tabla] = resultados;
                console.log(`✅ ${tabla}: ${resultados.length} registros`);
            } catch (error) {
                console.log(`⚠️  ${tabla}: tabla no existe o error - ${error.message}`);
                respaldo[tabla] = [];
            }
        }

        // Guardar respaldo
        fs.writeFileSync(archivo, JSON.stringify(respaldo, null, 2));

        console.log(`\n✅ Respaldo creado exitosamente: ${archivo}`);
        console.log(`📊 Total de tablas respaldadas: ${Object.keys(respaldo).length}`);
        
        // Resumen
        const totalRegistros = Object.values(respaldo).reduce((sum, data) => sum + data.length, 0);
        console.log(`📦 Total de registros: ${totalRegistros}`);

        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error al crear respaldo:', error);
        await sequelize.close();
        process.exit(1);
    }
}

crearRespaldo();
