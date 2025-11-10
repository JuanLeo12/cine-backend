/**
 * Script para verificar toda la información del usuario Leo
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

async function verificarLeo() {
  try {
    console.log('🔌 Conectando a Railway PostgreSQL...\n');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    // PASO 1: Buscar usuario Leo
    console.log('👤 PASO 1: Información del usuario Leo\n');
    const resultadoUsuario = await client.query(`
      SELECT id, nombre, email, rol, fecha_registro
      FROM usuarios
      WHERE LOWER(nombre) LIKE '%leo%' OR LOWER(email) LIKE '%leo%'
      ORDER BY nombre;
    `);

    if (resultadoUsuario.rows.length === 0) {
      console.log('❌ No se encontró ningún usuario con "Leo" en el nombre o email\n');
      await client.end();
      return;
    }

    console.log(`Usuarios encontrados: ${resultadoUsuario.rows.length}\n`);
    resultadoUsuario.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Nombre: ${user.nombre}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.rol}`);
      console.log(`   Creado: ${user.fecha_registro}`);
      console.log('');
    });

    // Usar el primer Leo encontrado para análisis detallado
    const leoId = resultadoUsuario.rows[0].id;
    const leoNombre = resultadoUsuario.rows[0].nombre;
    const leoRol = resultadoUsuario.rows[0].rol;

    console.log(`\n📊 Análisis detallado de: ${leoNombre} (ID: ${leoId}, Rol: ${leoRol})\n`);

    // PASO 2: Todas las órdenes de compra
    console.log('🛒 PASO 2: Órdenes de Compra\n');
    const resultadoOrdenes = await client.query(`
      SELECT 
        oc.id,
        oc.estado,
        oc.monto_total,
        oc.fecha_compra,
        mp.nombre as metodo_pago,
        p.monto_total as monto_pagado,
        p.estado_pago
      FROM ordenes_compra oc
      LEFT JOIN pagos p ON p.id_orden_compra = oc.id
      LEFT JOIN metodos_pago mp ON p.id_metodo_pago = mp.id
      WHERE oc.id_usuario = $1
      ORDER BY oc.fecha_compra DESC;
    `, [leoId]);

    if (resultadoOrdenes.rows.length === 0) {
      console.log('   No tiene órdenes de compra\n');
    } else {
      resultadoOrdenes.rows.forEach((orden, index) => {
        console.log(`${index + 1}. Orden ID: ${orden.id}`);
        console.log(`   Estado: ${orden.estado}`);
        console.log(`   Total: $${orden.monto_total}`);
        console.log(`   Método Pago: ${orden.metodo_pago || 'N/A'}`);
        console.log(`   Estado Pago: ${orden.estado_pago || 'N/A'}`);
        console.log(`   Fecha: ${orden.fecha_compra}`);
        console.log('');
      });
    }

    // PASO 3: Vales Corporativos
    console.log('🎫 PASO 3: Vales Corporativos\n');
    const resultadoVales = await client.query(`
      SELECT 
        v.id,
        v.codigo,
        v.tipo,
        v.usado,
        oc.id as orden_id,
        oc.estado as orden_estado,
        oc.fecha_compra
      FROM vales_corporativos v
      LEFT JOIN pagos p ON v.id_pago = p.id
      LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
      WHERE oc.id_usuario = $1
      ORDER BY v.id DESC;
    `, [leoId]);

    if (resultadoVales.rows.length === 0) {
      console.log('   No tiene vales corporativos\n');
    } else {
      console.log(`   ⚠️  ${resultadoVales.rows.length} vale(s) encontrado(s):\n`);
      resultadoVales.rows.forEach((vale, index) => {
        console.log(`${index + 1}. Vale ID: ${vale.id}`);
        console.log(`   Código: ${vale.codigo}`);
        console.log(`   Tipo: ${vale.tipo}`);
        console.log(`   Usado: ${vale.usado ? 'Sí' : 'No'}`);
        console.log(`   Orden ID: ${vale.orden_id}`);
        console.log(`   Estado Orden: ${vale.orden_estado}`);
        console.log('');
      });
    }

    // PASO 4: Tickets de Películas
    console.log('🎬 PASO 4: Tickets de Películas\n');
    const resultadoTickets = await client.query(`
      SELECT 
        ot.id,
        ot.cantidad,
        ot.precio_unitario,
        ot.tipo_ticket,
        oc.fecha_compra,
        p.titulo as pelicula,
        f.fecha as fecha_funcion,
        f.hora_inicio
      FROM ordenes_tickets ot
      JOIN pagos pago ON ot.id_pago = pago.id
      JOIN ordenes_compra oc ON pago.id_orden_compra = oc.id
      LEFT JOIN funciones f ON ot.id_funcion = f.id
      LEFT JOIN peliculas p ON f.id_pelicula = p.id
      WHERE oc.id_usuario = $1
      ORDER BY oc.fecha_compra DESC;
    `, [leoId]);

    if (resultadoTickets.rows.length === 0) {
      console.log('   No tiene tickets de películas\n');
    } else {
      console.log(`   ${resultadoTickets.rows.length} ticket(s) encontrado(s):\n`);
      resultadoTickets.rows.forEach((ticket, index) => {
        console.log(`${index + 1}. Orden Ticket ID: ${ticket.id}`);
        console.log(`   Película: ${ticket.pelicula || 'N/A'}`);
        console.log(`   Tipo: ${ticket.tipo_ticket}`);
        console.log(`   Cantidad: ${ticket.cantidad}`);
        console.log(`   Precio Unit: $${ticket.precio_unitario}`);
        console.log(`   Función: ${ticket.fecha_funcion || 'N/A'} ${ticket.hora_inicio || ''}`);
        console.log('');
      });
    }

    // PASO 5: Combos
    console.log('🍿 PASO 5: Combos\n');
    const resultadoCombos = await client.query(`
      SELECT 
        oco.id,
        oco.cantidad,
        oco.precio_unitario,
        c.nombre as combo_nombre,
        oc.fecha_compra
      FROM ordenes_combos oco
      JOIN pagos pago ON oco.id_pago = pago.id
      JOIN ordenes_compra oc ON pago.id_orden_compra = oc.id
      LEFT JOIN combos c ON oco.id_combo = c.id
      WHERE oc.id_usuario = $1
      ORDER BY oc.fecha_compra DESC;
    `, [leoId]);

    if (resultadoCombos.rows.length === 0) {
      console.log('   No tiene combos\n');
    } else {
      console.log(`   ${resultadoCombos.rows.length} combo(s) encontrado(s):\n`);
      resultadoCombos.rows.forEach((combo, index) => {
        console.log(`${index + 1}. Orden Combo ID: ${combo.id}`);
        console.log(`   Combo: ${combo.combo_nombre || 'N/A'}`);
        console.log(`   Cantidad: ${combo.cantidad}`);
        console.log(`   Precio Unit: $${combo.precio_unitario}`);
        console.log(`   Fecha: ${combo.fecha_compra}`);
        console.log('');
      });
    }

    console.log('✅ Análisis completado\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n📋 Detalles:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada\n');
  }
}

verificarLeo();
