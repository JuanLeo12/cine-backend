require('dotenv').config();
const { sequelize } = require('./models');

(async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        oc.id as orden_id, 
        COUNT(ot.id) as total_orden_tickets, 
        SUM(CASE WHEN ot.descuento > 0 THEN 1 ELSE 0 END) as con_descuento,
        SUM(ot.cantidad) as total_cantidad
      FROM ordenes_compra oc 
      JOIN ordenes_tickets ot ON ot.id_orden_compra = oc.id 
      GROUP BY oc.id 
      HAVING SUM(CASE WHEN ot.descuento > 0 THEN 1 ELSE 0 END) > 0 
      ORDER BY oc.id DESC 
      LIMIT 5
    `);
    
    console.log('📊 Órdenes con descuentos en tickets:\n');
    
    for (const r of results) {
      console.log(`\n📦 Orden #${r.orden_id}:`);
      console.log(`   - Total OrdenTickets: ${r.total_orden_tickets}`);
      console.log(`   - OrdenTickets con descuento > 0: ${r.con_descuento}`);
      console.log(`   - Total tickets: ${r.total_cantidad}`);
      
      // Ver detalles
      const [details] = await sequelize.query(`
        SELECT id, cantidad, precio_unitario, descuento 
        FROM ordenes_tickets 
        WHERE id_orden_compra = ${r.orden_id}
        ORDER BY id
      `);
      
      console.log('\n   Detalles:');
      details.forEach(d => {
        console.log(`     OT #${d.id}: cantidad=${d.cantidad}, precio=S/${d.precio_unitario}, descuento=S/${d.descuento}`);
      });
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
