require('dotenv').config();
const { Pago, MetodoPago, OrdenCompra } = require('./models');

async function verificarPagos() {
  try {
    console.log('🔍 Verificando pagos en la base de datos...\n');

    const pagos = await Pago.findAll({
      include: [
        {
          model: MetodoPago,
          as: 'metodoPago',
          attributes: ['id', 'nombre', 'estado']
        },
        {
          model: OrdenCompra,
          as: 'ordenCompra',
          attributes: ['id']
        }
      ],
      limit: 10,
      order: [['id', 'DESC']]
    });

    console.log(`📊 Total de pagos encontrados: ${pagos.length}\n`);

    pagos.forEach((pago, index) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Pago #${index + 1}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`ID Pago: ${pago.id}`);
      console.log(`ID Orden Compra: ${pago.id_orden_compra}`);
      console.log(`ID Método Pago: ${pago.id_metodo_pago}`);
      console.log(`Monto Total: S/ ${pago.monto_total}`);
      console.log(`Estado: ${pago.estado_pago}`);
      console.log(`Fecha: ${pago.fecha_pago}`);
      console.log(`\n🏦 Método de Pago:`);
      
      if (pago.metodoPago) {
        console.log(`   ✅ CARGADO`);
        console.log(`   - ID: ${pago.metodoPago.id}`);
        console.log(`   - Nombre: ${pago.metodoPago.nombre}`);
        console.log(`   - Estado: ${pago.metodoPago.estado}`);
      } else {
        console.log(`   ❌ NO CARGADO (metodoPago es null)`);
        console.log(`   ⚠️  Pero id_metodo_pago existe: ${pago.id_metodo_pago}`);
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verificarPagos();
