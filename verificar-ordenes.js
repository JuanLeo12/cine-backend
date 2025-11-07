process.env.DATABASE_URL = "postgresql://postgres:DBZrIdESMKsKHHEIKbEpIILwtYGwqlsJ@switchback.proxy.rlwy.net:56790/railway";

const { OrdenCompra, Usuario } = require('./models');

async function verificarOrdenes() {
  try {
    console.log('🔍 Verificando órdenes de compra...\n');
    
    const ordenes = await OrdenCompra.findAll({
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'email', 'nombre']
      }],
      order: [['id', 'ASC']]
    });

    console.log(`📊 Total de órdenes: ${ordenes.length}\n`);

    if (ordenes.length === 0) {
      console.log('⚠️  No hay órdenes en la base de datos');
    } else {
      console.log('📦 Órdenes por usuario:');
      console.log('='.repeat(80));
      
      ordenes.forEach(orden => {
        console.log(`ID Orden: ${orden.id.toString().padEnd(4)} | Usuario: ${orden.usuario?.email || 'N/A'} | Total: S/ ${orden.total} | Estado: ${orden.estado}`);
      });
      console.log('='.repeat(80));

      // Agrupar por usuario
      const porUsuario = ordenes.reduce((acc, orden) => {
        const email = orden.usuario?.email || 'Sin usuario';
        acc[email] = (acc[email] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📈 Resumen por usuario:');
      Object.entries(porUsuario).forEach(([email, count]) => {
        console.log(`  ${email.padEnd(35)} ${count} orden(es)`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarOrdenes();
