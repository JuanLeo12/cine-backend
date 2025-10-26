const { AsientoFuncion, Ticket, OrdenCompra, OrdenTicket } = require('./models');

async function verificarAsientos() {
  try {
    console.log('🔍 Verificando asientos ocupados...\n');

    const asientosOcupados = await AsientoFuncion.findAll({
      where: { estado: 'ocupado' },
      attributes: ['id', 'fila', 'numero', 'estado', 'id_usuario_bloqueo', 'id_funcion'],
      order: [['fila', 'ASC'], ['numero', 'ASC']]
    });

    console.log(`📊 Total de asientos ocupados: ${asientosOcupados.length}\n`);

    for (const asiento of asientosOcupados) {
      const ticket = await Ticket.findOne({
        where: { id_asiento: asiento.id },
        include: [{
          model: OrdenTicket,
          as: 'ordenTicket',
          include: [{
            model: OrdenCompra,
            as: 'ordenCompra'
          }]
        }]
      });

      if (ticket) {
        const orden = ticket.ordenTicket?.ordenCompra;
        console.log(`   ✅ ${asiento.fila}${asiento.numero} - Orden #${orden?.id} (estado: ${orden?.estado})`);
      } else {
        console.log(`   ❌ ${asiento.fila}${asiento.numero} - SIN TICKET (huérfano)`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarAsientos();
