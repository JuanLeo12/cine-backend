/**
 * Script para verificar QUÉ servicio corporativo tiene Leo
 */

const { Client } = require('pg');

const client = new Client({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: {
    rejectUnauthorized: false
  }
});

async function verificarServicioLeo() {
  try {
    console.log('🔌 Conectando a Railway PostgreSQL...\n');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    // Buscar Leo
    const resultadoUsuario = await client.query(`
      SELECT id, nombre, email, rol
      FROM usuarios
      WHERE LOWER(nombre) = 'leo';
    `);

    const leoId = resultadoUsuario.rows[0].id;
    console.log(`👤 Usuario: ${resultadoUsuario.rows[0].nombre} (ID: ${leoId}, Rol: ${resultadoUsuario.rows[0].rol})\n`);

    // Ver TODOS los servicios corporativos
    console.log('🎫 Servicios Corporativos de Leo:\n');
    
    // 1. Vales Corporativos
    console.log('1️⃣ VALES CORPORATIVOS:\n');
    const vales = await client.query(`
      SELECT v.id, v.codigo, v.tipo, v.usado, p.fecha_pago
      FROM vales_corporativos v
      JOIN pagos p ON v.id_pago = p.id
      JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
      WHERE oc.id_usuario = $1;
    `, [leoId]);
    
    if (vales.rows.length === 0) {
      console.log('   ❌ No tiene vales corporativos\n');
    } else {
      vales.rows.forEach(v => {
        console.log(`   - Vale ${v.codigo} (${v.tipo}) - Usado: ${v.usado ? 'Sí' : 'No'}`);
      });
      console.log('');
    }

    // 2. Funciones Privadas (Alquiler de Sala)
    console.log('2️⃣ FUNCIONES PRIVADAS (Alquiler de Sala):\n');
    const alquileres = await client.query(`
      SELECT 
        a.id,
        a.fecha as fecha_evento,
        a.hora_inicio,
        a.hora_fin,
        a.precio,
        s.nombre as sala,
        a.descripcion_evento,
        p.fecha_pago
      FROM alquiler_salas a
      JOIN pagos p ON a.id_pago = p.id
      LEFT JOIN salas s ON a.id_sala = s.id
      WHERE a.id_usuario = $1
      ORDER BY p.fecha_pago DESC;
    `, [leoId]);

    if (alquileres.rows.length === 0) {
      console.log('   ❌ No tiene alquileres de sala\n');
    } else {
      console.log(`   ✅ ${alquileres.rows.length} alquiler(es) encontrado(s):\n`);
      alquileres.rows.forEach((alq, index) => {
        console.log(`   ${index + 1}. Alquiler ID: ${alq.id}`);
        console.log(`      Sala: ${alq.sala || 'N/A'}`);
        console.log(`      Descripción: ${alq.descripcion_evento || 'N/A'}`);
        console.log(`      Fecha Evento: ${alq.fecha_evento}`);
        console.log(`      Horario: ${alq.hora_inicio} - ${alq.hora_fin}`);
        console.log(`      Precio: S/ ${alq.precio}`);
        console.log(`      Comprado: ${alq.fecha_pago}`);
        console.log('');
      });
    }

    // 3. Publicidad
    console.log('3️⃣ PUBLICIDAD:\n');
    const publicidad = await client.query(`
      SELECT 
        pub.id,
        pub.cliente,
        pub.tipo,
        pub.descripcion,
        pub.fecha_inicio,
        pub.fecha_fin,
        pub.precio,
        pub.estado,
        p.fecha_pago
      FROM publicidad pub
      JOIN pagos p ON pub.id_pago = p.id
      WHERE pub.id_usuario = $1
      ORDER BY p.fecha_pago DESC;
    `, [leoId]);

    if (publicidad.rows.length === 0) {
      console.log('   ❌ No tiene servicios de publicidad\n');
    } else {
      console.log(`   ✅ ${publicidad.rows.length} servicio(s) de publicidad:\n`);
      publicidad.rows.forEach((pub, index) => {
        console.log(`   ${index + 1}. Cliente: ${pub.cliente}`);
        console.log(`      Tipo: ${pub.tipo}`);
        console.log(`      Descripción: ${pub.descripcion || 'N/A'}`);
        console.log(`      Período: ${pub.fecha_inicio} - ${pub.fecha_fin}`);
        console.log(`      Precio: S/ ${pub.precio}`);
        console.log(`      Estado: ${pub.estado}`);
        console.log('');
      });
    }

    console.log('✅ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n📋 Detalles:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada\n');
  }
}

verificarServicioLeo();
