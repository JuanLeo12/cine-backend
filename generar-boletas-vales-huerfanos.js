/**
 * Script para generar boletas para vales corporativos sin boleta asociada
 * 
 * Ejecutar con: node generar-boletas-vales-huerfanos.js
 */

const { ValeCorporativo, BoletaCorporativa } = require('./models');
const crypto = require('crypto');
require('dotenv').config();

const generarCodigoUnico = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CORP-${timestamp}-${random}`;
};

async function generarBoletasHuerfanas() {
  try {
    console.log('🔍 Buscando vales sin boleta asociada...');

    // Obtener todos los vales
    const vales = await ValeCorporativo.findAll({
      attributes: ['id', 'codigo', 'tipo', 'valor', 'fecha_expiracion']
    });

    console.log(`📊 Total de vales encontrados: ${vales.length}`);

    let boletasCreadas = 0;
    let boletasExistentes = 0;
    let errores = 0;

    for (const vale of vales) {
      try {
        // Verificar si ya existe boleta para este vale
        const boletaExistente = await BoletaCorporativa.findOne({
          where: { 
            tipo: 'vales_corporativos', 
            id_referencia: vale.id 
          }
        });

        if (boletaExistente) {
          console.log(`✓ Vale ${vale.codigo} ya tiene boleta (ID: ${boletaExistente.id})`);
          boletasExistentes++;
          continue;
        }

        // Crear boleta para vale huérfano
        const codigoUnico = generarCodigoUnico();
        
        // Crear datos QR simplificados
        const datosQR = JSON.stringify({
          tipo: 'VALES_CORPORATIVOS',
          codigo: codigoUnico,
          fecha_emision: new Date().toISOString(),
          servicio: {
            tipo_servicio: 'Vale Corporativo',
            codigo: vale.codigo,
            tipo: vale.tipo,
            valor_por_uso: parseFloat(vale.valor || 0),
            fecha_expiracion: vale.fecha_expiracion,
            id_vale: vale.id
          }
        }, null, 2);

        const boleta = await BoletaCorporativa.create({
          tipo: 'vales_corporativos',
          id_referencia: vale.id,
          codigo_qr: datosQR,
          estado: 'activa'
        });

        console.log(`✅ Boleta creada para vale ${vale.codigo} (Boleta ID: ${boleta.id})`);
        boletasCreadas++;

      } catch (error) {
        console.error(`❌ Error procesando vale ${vale.codigo}:`, error.message);
        errores++;
      }
    }

    console.log('\n📋 RESUMEN:');
    console.log(`   Total vales: ${vales.length}`);
    console.log(`   ✅ Boletas creadas: ${boletasCreadas}`);
    console.log(`   ℹ️  Boletas existentes: ${boletasExistentes}`);
    console.log(`   ❌ Errores: ${errores}`);

    if (boletasCreadas > 0) {
      console.log('\n✨ ¡Listo! Ahora los vales tienen sus boletas asociadas.');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar
generarBoletasHuerfanas();
