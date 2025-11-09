/**
 * Script para limpiar vales corporativos asociados incorrectamente a clientes normales
 * Solo los usuarios corporativos deberían tener vales corporativos
 */

const sequelize = require('./config/db');
const { ValeCorporativo, Pago, OrdenCompra, Usuario } = require('./models');

async function limpiarValesClientes() {
  try {
    console.log('🔍 Iniciando limpieza de vales corporativos...\n');

    // 1. Buscar vales asociados a clientes normales
    const valesClientes = await sequelize.query(`
      SELECT 
        v.id as vale_id,
        v.codigo,
        v.tipo,
        v.usado,
        u.id as usuario_id,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.rol as usuario_rol,
        oc.id as orden_id,
        oc.fecha_compra
      FROM vales_corporativos v
      LEFT JOIN pagos p ON v.id_pago = p.id
      LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
      LEFT JOIN usuarios u ON oc.id_usuario = u.id
      WHERE u.rol = 'cliente'
      ORDER BY v.id;
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`📊 Encontrados ${valesClientes.length} vales asociados a clientes normales\n`);

    if (valesClientes.length === 0) {
      console.log('✅ No hay vales que limpiar. Todo está correcto.');
      await sequelize.close();
      return;
    }

    // 2. Mostrar detalles de los vales a eliminar
    console.log('📋 Vales que serán eliminados:\n');
    valesClientes.forEach((vale, index) => {
      console.log(`${index + 1}. Vale ID: ${vale.vale_id}`);
      console.log(`   Código: ${vale.codigo}`);
      console.log(`   Tipo: ${vale.tipo}`);
      console.log(`   Usado: ${vale.usado ? 'Sí' : 'No'}`);
      console.log(`   Cliente: ${vale.usuario_nombre} (${vale.usuario_email})`);
      console.log(`   Rol: ${vale.usuario_rol}`);
      console.log(`   Orden: #${vale.orden_id}`);
      console.log(`   Fecha compra: ${vale.fecha_compra}`);
      console.log('');
    });

    // 3. Confirmación de eliminación
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmar = await new Promise((resolve) => {
      readline.question(
        `⚠️  ¿Deseas eliminar estos ${valesClientes.length} vales? (si/no): `,
        (answer) => {
          readline.close();
          resolve(answer.toLowerCase() === 'si' || answer.toLowerCase() === 's');
        }
      );
    });

    if (!confirmar) {
      console.log('\n❌ Operación cancelada por el usuario.');
      await sequelize.close();
      return;
    }

    // 4. Eliminar vales
    console.log('\n🗑️  Eliminando vales...');
    
    const idsVales = valesClientes.map(v => v.vale_id);
    
    const resultado = await ValeCorporativo.destroy({
      where: {
        id: idsVales
      }
    });

    console.log(`\n✅ ${resultado} vales eliminados exitosamente\n`);

    // 5. Verificación final
    const valesRestantes = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM vales_corporativos v
      LEFT JOIN pagos p ON v.id_pago = p.id
      LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
      LEFT JOIN usuarios u ON oc.id_usuario = u.id
      WHERE u.rol = 'cliente';
    `, { type: sequelize.QueryTypes.SELECT });

    if (valesRestantes[0].total === 0) {
      console.log('✅ Verificación completada: No quedan vales asociados a clientes normales');
    } else {
      console.log(`⚠️  Advertencia: Aún quedan ${valesRestantes[0].total} vales asociados a clientes`);
    }

    // 6. Mostrar resumen de vales corporativos válidos
    const valesCorporativos = await sequelize.query(`
      SELECT 
        COUNT(*) as total_vales,
        COUNT(DISTINCT u.id) as usuarios_corporativos
      FROM vales_corporativos v
      LEFT JOIN pagos p ON v.id_pago = p.id
      LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
      LEFT JOIN usuarios u ON oc.id_usuario = u.id
      WHERE u.rol = 'corporativo';
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n📊 Resumen de vales corporativos válidos:');
    console.log(`   Total de vales: ${valesCorporativos[0].total_vales}`);
    console.log(`   Usuarios corporativos: ${valesCorporativos[0].usuarios_corporativos}`);

    await sequelize.close();
    console.log('\n✅ Script completado exitosamente');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    console.error('Stack:', error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

// Ejecutar script
limpiarValesClientes();
