const { OrdenCompra, OrdenTicket, Ticket, AsientoFuncion, Pago, OrdenCombo, sequelize } = require('./models');

async function limpiarOrdenesPendientes() {
  const t = await sequelize.transaction();
  
  try {
    console.log('🔍 Buscando órdenes pendientes sin pago...\n');

    // Buscar órdenes pendientes sin pago
    const ordenesPendientes = await OrdenCompra.findAll({
      where: { estado: 'pendiente' },
      include: [{ model: Pago, as: 'pago' }],
      transaction: t
    });

    console.log(`📊 Órdenes pendientes encontradas: ${ordenesPendientes.length}\n`);

    for (const orden of ordenesPendientes) {
      console.log(`🔍 Orden #${orden.id} (Usuario ${orden.id_usuario}):`);

      // Verificar si tiene pago
      if (orden.pago) {
        console.log(`   ✅ Tiene pago (estado: ${orden.pago.estado_pago}) - NO se eliminará`);
        continue;
      }

      console.log(`   ❌ NO tiene pago - Se procederá a limpiar`);

      // 1. Liberar asientos ocupados
      if (orden.id_funcion) {
        const tickets = await Ticket.findAll({
          include: [{
            model: OrdenTicket,
            as: 'ordenTicket',
            where: { id_orden_compra: orden.id }
          }],
          transaction: t
        });

        console.log(`   📋 Tickets encontrados: ${tickets.length}`);

        for (const ticket of tickets) {
          if (ticket.id_asiento) {
            const asiento = await AsientoFuncion.findByPk(ticket.id_asiento, { transaction: t });
            if (asiento && asiento.estado === 'ocupado') {
              await asiento.destroy({ transaction: t });
              console.log(`      🆓 Asiento liberado: ${asiento.fila}${asiento.numero}`);
            }
          }
          
          // Eliminar ticket
          await ticket.destroy({ transaction: t });
        }
      }

      // 2. Eliminar órdenes de tickets
      await OrdenTicket.destroy({
        where: { id_orden_compra: orden.id },
        transaction: t
      });

      // 3. Eliminar órdenes de combos
      await OrdenCombo.destroy({
        where: { id_orden_compra: orden.id },
        transaction: t
      });

      // 4. Eliminar la orden
      await orden.destroy({ transaction: t });

      console.log(`   ✅ Orden #${orden.id} eliminada completamente\n`);
    }

    await t.commit();
    console.log('🎉 Limpieza completada exitosamente');
    process.exit(0);

  } catch (error) {
    await t.rollback();
    console.error('❌ Error durante limpieza:', error);
    process.exit(1);
  }
}

limpiarOrdenesPendientes();
