/**
 * Script para corregir descuentos en órdenes antiguas
 * 
 * Problema: El descuento total estaba guardado en un solo OrdenTicket/OrdenCombo
 * Solución: Distribuir el descuento entre todos los items de la orden
 */

require('dotenv').config();
const { sequelize, OrdenCompra, OrdenTicket, OrdenCombo } = require('./models');
const { Op } = require('sequelize');

async function corregirDescuentos() {
  try {
    console.log('🔄 Iniciando corrección de descuentos...\n');

    // Obtener todas las órdenes con descuentos
    const ordenesConDescuento = await OrdenCompra.findAll({
      include: [
        {
          model: OrdenTicket,
          as: 'ordenTickets',
          where: { descuento: { [Op.gt]: 0 } },
          required: false
        },
        {
          model: OrdenCombo,
          as: 'ordenCombos',
          where: { descuento: { [Op.gt]: 0 } },
          required: false
        }
      ]
    });

    console.log(`📋 Encontradas ${ordenesConDescuento.length} órdenes con descuentos\n`);

    let ordenesCorregidas = 0;
    let ticketsCorregidos = 0;
    let combosCorregidos = 0;

    for (const orden of ordenesConDescuento) {
      console.log(`\n📦 Procesando Orden #${orden.id}:`);

      // =============================================
      // CORREGIR DESCUENTOS EN TICKETS
      // =============================================
      if (orden.ordenTickets && orden.ordenTickets.length > 0) {
        // Obtener TODOS los OrdenTicket de esta orden (no solo los que tienen descuento)
        const todosTickets = await OrdenTicket.findAll({
          where: { id_orden_compra: orden.id }
        });

        // Buscar si alguno tiene descuento
        const ticketConDescuento = orden.ordenTickets.find(ot => ot.descuento > 0);
        
        if (ticketConDescuento && todosTickets.length > 1) {
          const descuentoTotal = ticketConDescuento.descuento;
          const cantidadTotal = todosTickets.reduce((sum, ot) => sum + ot.cantidad, 0);
          const descuentoUnitario = descuentoTotal / cantidadTotal;

          console.log(`  🎫 Tickets:`);
          console.log(`     - Descuento total encontrado: S/ ${descuentoTotal.toFixed(2)}`);
          console.log(`     - Cantidad total de tickets: ${cantidadTotal}`);
          console.log(`     - Descuento unitario correcto: S/ ${descuentoUnitario.toFixed(2)}`);

          // Aplicar descuento unitario a TODOS los OrdenTicket
          for (const ticket of todosTickets) {
            const descuentoAntiguo = ticket.descuento;
            await ticket.update({ descuento: descuentoUnitario });
            console.log(`     ✅ OrdenTicket #${ticket.id}: S/ ${descuentoAntiguo.toFixed(2)} → S/ ${descuentoUnitario.toFixed(2)}`);
            ticketsCorregidos++;
          }
        } else if (ticketConDescuento) {
          console.log(`  ⚠️ Solo hay 1 OrdenTicket, descuento ya está correcto`);
        }
      }

      // =============================================
      // CORREGIR DESCUENTOS EN COMBOS
      // =============================================
      if (orden.ordenCombos && orden.ordenCombos.length > 0) {
        // Obtener TODOS los OrdenCombo de esta orden
        const todosCombos = await OrdenCombo.findAll({
          where: { id_orden_compra: orden.id }
        });

        // Buscar si alguno tiene descuento
        const comboConDescuento = orden.ordenCombos.find(oc => oc.descuento > 0);
        
        if (comboConDescuento && todosCombos.length > 1) {
          const descuentoTotal = comboConDescuento.descuento;
          const cantidadTotal = todosCombos.reduce((sum, oc) => sum + oc.cantidad, 0);
          const descuentoUnitario = descuentoTotal / cantidadTotal;

          console.log(`  🍿 Combos:`);
          console.log(`     - Descuento total encontrado: S/ ${descuentoTotal.toFixed(2)}`);
          console.log(`     - Cantidad total de combos: ${cantidadTotal}`);
          console.log(`     - Descuento unitario correcto: S/ ${descuentoUnitario.toFixed(2)}`);

          // Aplicar descuento unitario a TODOS los OrdenCombo
          for (const combo of todosCombos) {
            const descuentoAntiguo = combo.descuento;
            await combo.update({ descuento: descuentoUnitario });
            console.log(`     ✅ OrdenCombo #${combo.id}: S/ ${descuentoAntiguo.toFixed(2)} → S/ ${descuentoUnitario.toFixed(2)}`);
            combosCorregidos++;
          }
        } else if (comboConDescuento) {
          console.log(`  ⚠️ Solo hay 1 OrdenCombo, descuento ya está correcto`);
        }
      }

      ordenesCorregidas++;
    }

    console.log('\n✅ ==========================================');
    console.log('✅ CORRECCIÓN COMPLETADA');
    console.log('✅ ==========================================');
    console.log(`📊 Órdenes procesadas: ${ordenesCorregidas}`);
    console.log(`🎫 OrdenTickets corregidos: ${ticketsCorregidos}`);
    console.log(`🍿 OrdenCombos corregidos: ${combosCorregidos}`);
    console.log('\n💡 Ahora todas las compras mostrarán valores correctos en "Mis Compras"');

  } catch (error) {
    console.error('❌ Error al corregir descuentos:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar script
corregirDescuentos()
  .then(() => {
    console.log('\n👋 Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado con errores:', error);
    process.exit(1);
  });
