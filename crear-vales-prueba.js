/**
 * Script para crear vales corporativos de prueba
 * Ejecutar: node crear-vales-prueba.js
 */

const { ValeCorporativo } = require('./models');

async function crearValesPrueba() {
    try {
        console.log('🎟️  Creando vales corporativos de prueba...\n');

        const vales = [
            {
                codigo: 'BCP2024',
                tipo: 'entrada',
                valor: 15.00, // S/ 15 de descuento en entradas
                fecha_expiracion: new Date('2025-12-31'),
                usado: false
            },
            {
                codigo: 'TELEFONICA10',
                tipo: 'entrada',
                valor: 10.00, // S/ 10 de descuento en entradas
                fecha_expiracion: new Date('2025-12-31'),
                usado: false
            },
            {
                codigo: 'PROMO50',
                tipo: 'entrada',
                valor: 50.00, // S/ 50 de descuento en entradas
                fecha_expiracion: new Date('2025-12-31'),
                usado: false
            },
            {
                codigo: 'COMBO20',
                tipo: 'combo',
                valor: 20.00, // S/ 20 de descuento en combos
                fecha_expiracion: new Date('2025-12-31'),
                usado: false
            }
        ];

        for (const valeData of vales) {
            const existente = await ValeCorporativo.findOne({ where: { codigo: valeData.codigo } });
            
            if (existente) {
                console.log(`⚠️  Vale ${valeData.codigo} ya existe (ID: ${existente.id})`);
                continue;
            }

            const vale = await ValeCorporativo.create(valeData);
            console.log(`✅ Vale creado: ${vale.codigo}`);
            console.log(`   - Tipo: ${vale.tipo}`);
            console.log(`   - Valor: S/ ${vale.valor}`);
            console.log(`   - Expira: ${new Date(vale.fecha_expiracion).toLocaleDateString('es-PE')}\n`);
        }

        console.log('✅ Proceso completado\n');
        console.log('📋 Vales disponibles para prueba:');
        console.log('   • BCP2024 → S/ 15 descuento en entradas');
        console.log('   • TELEFONICA10 → S/ 10 descuento en entradas');
        console.log('   • PROMO50 → S/ 50 descuento en entradas');
        console.log('   • COMBO20 → S/ 20 descuento en combos');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al crear vales:', error);
        process.exit(1);
    }
}

crearValesPrueba();
