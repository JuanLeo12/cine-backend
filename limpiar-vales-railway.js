/**
 * Script para limpiar vales corporativos asociados incorrectamente a clientes
 * Se conecta directamente a Railway usando las variables de entorno
 */

const { Client } = require('pg');

// Configuración de conexión a Railway
// Copia estos valores desde Railway → PostgreSQL → Variables
const client = new Client({
  host: process.env.PGHOST || 'TU_PGHOST_AQUI',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'TU_PGUSER_AQUI',
  password: process.env.PGPASSWORD || 'TU_PGPASSWORD_AQUI',
  database: process.env.PGDATABASE || 'TU_PGDATABASE_AQUI',
  ssl: {
    rejectUnauthorized: false
  }
});

async function limpiarValesClientes() {
  try {
    console.log('🔌 Conectando a Railway PostgreSQL...\n');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    // PASO 1: Ver qué vales se van a eliminar
    console.log('📋 PASO 1: Vales que se eliminarán:\n');
    const resultadoVer = await client.query(`
      SELECT 
        v.id as vale_id,
        v.codigo,
        v.tipo,
        v.usado,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.rol as usuario_rol,
        oc.fecha_compra
      FROM vales_corporativos v
      LEFT JOIN pagos p ON v.id_pago = p.id
      LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
      LEFT JOIN usuarios u ON oc.id_usuario = u.id
      WHERE u.rol = 'cliente';
    `);

    if (resultadoVer.rows.length === 0) {
      console.log('✅ No hay vales de clientes para eliminar. Todo está correcto.\n');
      await client.end();
      return;
    }

    console.log(`⚠️  Se encontraron ${resultadoVer.rows.length} vale(s) de clientes:\n`);
    resultadoVer.rows.forEach((vale, index) => {
      console.log(`${index + 1}. Vale ID: ${vale.vale_id}`);
      console.log(`   Código: ${vale.codigo}`);
      console.log(`   Tipo: ${vale.tipo}`);
      console.log(`   Usado: ${vale.usado ? 'Sí' : 'No'}`);
      console.log(`   Usuario: ${vale.usuario_nombre} (${vale.usuario_email})`);
      console.log(`   Rol: ${vale.usuario_rol}`);
      console.log(`   Fecha Compra: ${vale.fecha_compra}`);
      console.log('');
    });

    // PASO 2: Confirmación
    console.log('⚠️  ¿DESEAS ELIMINAR ESTOS VALES?\n');
    console.log('   Esta acción es IRREVERSIBLE.\n');
    console.log('   Presiona Ctrl+C para cancelar, o espera 5 segundos para continuar...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // PASO 3: Eliminar vales
    console.log('🗑️  PASO 2: Eliminando vales de clientes...\n');
    const resultadoEliminar = await client.query(`
      DELETE FROM vales_corporativos
      WHERE id IN (
        SELECT v.id
        FROM vales_corporativos v
        LEFT JOIN pagos p ON v.id_pago = p.id
        LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
        LEFT JOIN usuarios u ON oc.id_usuario = u.id
        WHERE u.rol = 'cliente'
      );
    `);

    console.log(`✅ Eliminados: ${resultadoEliminar.rowCount} vale(s)\n`);

    // PASO 4: Verificar que no quedaron vales de clientes
    console.log('🔍 PASO 3: Verificando limpieza...\n');
    const resultadoVerificar = await client.query(`
      SELECT COUNT(*) as count
      FROM vales_corporativos v
      LEFT JOIN pagos p ON v.id_pago = p.id
      LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
      LEFT JOIN usuarios u ON oc.id_usuario = u.id
      WHERE u.rol = 'cliente';
    `);

    const restantes = parseInt(resultadoVerificar.rows[0].count);
    if (restantes === 0) {
      console.log('✅ Verificación exitosa: 0 vales de clientes restantes\n');
    } else {
      console.log(`⚠️  Advertencia: Aún quedan ${restantes} vales de clientes\n`);
    }

    // PASO 5: Resumen de vales corporativos válidos
    console.log('📊 PASO 4: Resumen de vales válidos:\n');
    const resultadoResumen = await client.query(`
      SELECT 
        COUNT(*) as total_vales,
        COUNT(DISTINCT u.id) as usuarios_corporativos
      FROM vales_corporativos v
      LEFT JOIN pagos p ON v.id_pago = p.id
      LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
      LEFT JOIN usuarios u ON oc.id_usuario = u.id
      WHERE u.rol = 'corporativo';
    `);

    const resumen = resultadoResumen.rows[0];
    console.log(`   Total vales corporativos válidos: ${resumen.total_vales}`);
    console.log(`   Usuarios corporativos con vales: ${resumen.usuarios_corporativos}\n`);

    console.log('🎉 ¡Limpieza completada exitosamente!\n');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    console.error('\n📋 Detalles del error:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada\n');
  }
}

// Ejecutar el script
limpiarValesClientes();
