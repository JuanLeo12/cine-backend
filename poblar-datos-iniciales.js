/**
 * 🌱 Script para poblar datos iniciales en Supabase
 * 
 * Ejecutar DESPUÉS de inicializar-bd-supabase.js
 * 
 * Este script crea:
 * - Tipos de ticket (Niño, Adulto, Adulto Mayor, CONADIS)
 * - Métodos de pago (Yape, Tarjeta de Crédito/Débito, Efectivo)
 * - Sedes de CineStar (16 sedes reales)
 * - Salas con capacidades diferenciadas por tipo (2D, 3D, 4DX, Xtreme)
 * - Usuarios (admin, clientes, corporativos)
 * 
 * Nota: Películas y combos se crean manualmente desde el Panel Admin
 */

require('dotenv').config();
const sequelize = require('./config/db');
const bcrypt = require('bcrypt');
const { TipoTicket, MetodoPago, Usuario, Sede, Sala } = require('./models');

async function poblarDatosIniciales() {
  try {
    console.log('🔌 Conectando a Supabase...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // 🎫 Tipos de Ticket
    console.log('🎫 Creando tipos de ticket...');
    const tiposTicket = [
      { nombre: 'Niño', precio_base: 10.00, estado: 'activo' },
      { nombre: 'Adulto', precio_base: 15.00, estado: 'activo' },
      { nombre: 'Adulto Mayor', precio_base: 8.00, estado: 'activo' },
      { nombre: 'CONADIS', precio_base: 8.00, estado: 'activo' },
    ];

    for (const tipo of tiposTicket) {
      const [registro, created] = await TipoTicket.findOrCreate({
        where: { nombre: tipo.nombre },
        defaults: tipo
      });
      console.log(`   ${created ? '✅' : '⏭️'} ${tipo.nombre} - S/ ${tipo.precio_base}`);
    }

    // 💳 Métodos de Pago
    console.log('\n💳 Creando métodos de pago...');
    const metodosPago = [
      { metodo: 'Yape', activo: true },
      { metodo: 'Tarjeta de Crédito/Débito', activo: true },
      { metodo: 'Efectivo', activo: true },
    ];

    for (const metodo of metodosPago) {
      const [registro, created] = await MetodoPago.findOrCreate({
        where: { metodo: metodo.metodo },
        defaults: metodo
      });
      console.log(`   ${created ? '✅' : '⏭️'} ${metodo.metodo}`);
    }

    // 🏢 Sedes CineStar (16 sedes reales)
    console.log('\n🏢 Creando sedes CineStar...');
    const sedes = [
      { nombre: 'Aviación', direccion: 'Av. Aviación 2681, San Borja', ciudad: 'Lima', telefono: '01-2254141', estado: 'activa' },
      { nombre: 'Benavides', direccion: 'Av. Alfredo Benavides 3866, Miraflores', ciudad: 'Lima', telefono: '01-6177888', estado: 'activa' },
      { nombre: 'Breña', direccion: 'Av. Brasil 2614, Breña', ciudad: 'Lima', telefono: '01-6177889', estado: 'activa' },
      { nombre: 'Centro Cívico', direccion: 'Av. Garcilaso de la Vega 1337, Lima', ciudad: 'Lima', telefono: '01-4233650', estado: 'activa' },
      { nombre: 'Excelsior', direccion: 'Jr. de la Unión 780, Lima', ciudad: 'Lima', telefono: '01-4289999', estado: 'activa' },
      { nombre: 'La Marina', direccion: 'Av. La Marina 2000, San Miguel', ciudad: 'Lima', telefono: '01-6177890', estado: 'activa' },
      { nombre: 'Las Américas', direccion: 'Av. Las Américas Sur 3434, Trujillo', ciudad: 'Trujillo', telefono: '044-600600', estado: 'activa' },
      { nombre: 'Porteño', direccion: 'Av. Ejército 782, Trujillo', ciudad: 'Trujillo', telefono: '044-207676', estado: 'activa' },
      { nombre: 'Primavera', direccion: 'Av. Primavera 2050, Santiago de Surco', ciudad: 'Lima', telefono: '01-6177891', estado: 'activa' },
      { nombre: 'San Juan', direccion: 'Av. Los Héroes 201, San Juan de Lurigancho', ciudad: 'Lima', telefono: '01-7157979', estado: 'activa' },
      { nombre: 'San Martín', direccion: 'Jr. de la Unión 1062, Lima', ciudad: 'Lima', telefono: '01-3303930', estado: 'activa' },
      { nombre: 'San Miguel', direccion: 'Av. La Marina 2000, San Miguel', ciudad: 'Lima', telefono: '01-4526346', estado: 'activa' },
      { nombre: 'Santa Clara', direccion: 'Av. Tomás Valle 1791, Ate', ciudad: 'Lima', telefono: '01-6177892', estado: 'activa' },
      { nombre: 'Tacna', direccion: 'Av. Circunvalación 490, Tacna', ciudad: 'Tacna', telefono: '052-746464', estado: 'activa' },
      { nombre: 'Tomás Valle', direccion: 'Av. Tomás Valle 1791, San Martín de Porres', ciudad: 'Lima', telefono: '01-7487878', estado: 'activa' },
      { nombre: 'UNI', direccion: 'Av. Tupac Amaru 210, Rímac', ciudad: 'Lima', telefono: '01-3828888', estado: 'activa' },
    ];

    const sedesCreadas = [];
    for (const sedeData of sedes) {
      const [sede, created] = await Sede.findOrCreate({
        where: { nombre: sedeData.nombre },
        defaults: sedeData
      });
      sedesCreadas.push(sede);
      console.log(`   ${created ? '✅' : '⏭️'} ${sedeData.nombre} - ${sedeData.ciudad}`);
    }

    // 🎬 Salas con capacidades diferenciadas por tipo
    console.log('\n🎬 Creando salas (con capacidades según tipo)...');
    console.log('   📊 Capacidades: 2D=300, 3D=192, 4DX=96, Xtreme=140');
    
    const configuracionesSalas = [
      // Salas 2D: 15 filas × 20 columnas = 300 asientos
      { tipos: ['2D', '2D', '2D'], filas: 15, columnas: 20 },
      // Salas 3D: 12 filas × 16 columnas = 192 asientos
      { tipos: ['3D', '3D'], filas: 12, columnas: 16 },
      // Sala 4DX: 8 filas × 12 columnas = 96 asientos
      { tipos: ['4DX'], filas: 8, columnas: 12 },
      // Sala Xtreme: 10 filas × 14 columnas = 140 asientos
      { tipos: ['Xtreme'], filas: 10, columnas: 14 },
    ];

    let salasCreadas = 0;
    for (const sede of sedesCreadas) {
      let numeroSala = 1;
      for (const config of configuracionesSalas) {
        for (const tipo of config.tipos) {
          const salaData = {
            nombre: `Sala ${numeroSala}`,
            tipo_sala: tipo,
            filas: config.filas,
            columnas: config.columnas,
            id_sede: sede.id,
            estado: 'activa'
          };
          
          const [sala, created] = await Sala.findOrCreate({
            where: { id_sede: sede.id, nombre: salaData.nombre },
            defaults: salaData
          });
          
          if (created) salasCreadas++;
          numeroSala++;
        }
      }
    }
    console.log(`   ✅ ${salasCreadas} salas creadas en ${sedesCreadas.length} sedes`);

    // 👥 Usuarios
    console.log('\n👥 Creando usuarios...');
    const usuarios = [
      // 🔑 Administrador (nombre, email, password)
      { 
        nombre: 'Administrador', 
        email: 'admin@cinestar.com', 
        password: 'admin123',
        rol: 'admin', 
        estado: 'activo' 
      },
      
      // 👤 Clientes (nombre, apellido, dni, telefono, direccion, fecha_nacimiento, genero, email, password)
      { 
        nombre: 'Juan', 
        apellido: 'Pérez',
        dni: '12345678',
        telefono: '987654321',
        direccion: 'Av. Arequipa 1234, Lima',
        fecha_nacimiento: '1990-05-15',
        genero: 'masculino',
        email: 'juan@gmail.com', 
        password: 'juan123',
        rol: 'cliente', 
        estado: 'activo' 
      },
      { 
        nombre: 'María', 
        apellido: 'García',
        dni: '87654321',
        telefono: '987654322',
        direccion: 'Jr. Lima 567, Lima',
        fecha_nacimiento: '1992-08-20',
        genero: 'femenino',
        email: 'maria@gmail.com', 
        password: 'maria123',
        rol: 'cliente', 
        estado: 'activo' 
      },
      { 
        nombre: 'Carlos', 
        apellido: 'Rodriguez',
        dni: '11223344',
        telefono: '987654323',
        direccion: 'Av. Javier Prado 890, San Isidro',
        fecha_nacimiento: '1988-03-10',
        genero: 'masculino',
        email: 'carlos@hotmail.com', 
        password: 'carlos123',
        rol: 'cliente', 
        estado: 'activo' 
      },
      { 
        nombre: 'Ana', 
        apellido: 'Torres',
        dni: '55667788',
        telefono: '987654324',
        direccion: 'Calle Los Olivos 123, Miraflores',
        fecha_nacimiento: '1995-11-25',
        genero: 'femenino',
        email: 'ana.torres@gmail.com', 
        password: 'ana123',
        rol: 'cliente', 
        estado: 'activo' 
      },
      { 
        nombre: 'Luis', 
        apellido: 'Martínez',
        dni: '99887766',
        telefono: '987654325',
        direccion: 'Av. La Marina 456, Pueblo Libre',
        fecha_nacimiento: '1987-07-30',
        genero: 'masculino',
        email: 'luis.martinez@outlook.com', 
        password: 'luis123',
        rol: 'cliente', 
        estado: 'activo' 
      },
      
      // 🏢 Corporativos (nombre, ruc, representante, cargo, telefono, direccion, email, password)
      { 
        nombre: 'Empresa Corp SAC', 
        ruc: '20123456789',
        representante: 'Roberto Gómez',
        cargo: 'Gerente General',
        telefono: '987654326',
        direccion: 'Av. Benavides 2345, Miraflores',
        email: 'corporativo@empresa.com', 
        password: 'empresa123',
        rol: 'corporativo', 
        estado: 'activo' 
      },
      { 
        nombre: 'Banco de Crédito del Perú', 
        ruc: '20100047218',
        representante: 'Patricia Sánchez',
        cargo: 'Jefa de Recursos Humanos',
        telefono: '987654327',
        direccion: 'Av. Centenario 156, La Molina',
        email: 'corporativo@bcp.com.pe', 
        password: 'bcp123',
        rol: 'corporativo', 
        estado: 'activo' 
      },
      { 
        nombre: 'Telefónica del Perú', 
        ruc: '20109072177',
        representante: 'Miguel Ángel Vargas',
        cargo: 'Coordinador de Eventos',
        telefono: '987654328',
        direccion: 'Av. Arequipa 1155, Lima',
        email: 'eventos@telefonica.com.pe', 
        password: 'telefonica123',
        rol: 'corporativo', 
        estado: 'activo' 
      },
    ];

    for (const userData of usuarios) {
      const [usuario, created] = await Usuario.findOrCreate({
        where: { email: userData.email },
        defaults: {
          ...userData,
          password: await bcrypt.hash(userData.password, 10),
          token_version: 0
        }
      });
      
      if (created) {
        console.log(`   ✅ ${userData.nombre} (${userData.rol}) - ${userData.email}`);
      } else {
        console.log(`   ⏭️ ${userData.nombre} ya existe`);
      }
    }

    console.log('\n🎉 ¡Datos iniciales poblados correctamente!');
    console.log('\n📋 Resumen de datos creados:');
    console.log(`   🏢 16 sedes CineStar en Lima, Trujillo y Tacna`);
    console.log(`   🎬 ${salasCreadas} salas con capacidades diferenciadas:`);
    console.log(`      - Salas 2D: 300 asientos (15×20)`);
    console.log(`      - Salas 3D: 192 asientos (12×16)`);
    console.log(`      - Salas 4DX: 96 asientos (8×12)`);
    console.log(`      - Salas Xtreme: 140 asientos (10×14)`);
    console.log(`   👥 ${usuarios.length} usuarios (admin, clientes, corporativos)`);
    console.log('\n🔑 Credenciales de acceso:');
    console.log('   👤 Admin: admin@cinestar.com / admin123');
    console.log('   👤 Cliente: juan@gmail.com / juan123');
    console.log('   🏢 Corporativo: corporativo@empresa.com / empresa123');
    console.log('\n💡 Listo para usar! Ahora puedes:');
    console.log('   - Crear películas y combos desde el panel admin');
    console.log('   - Crear funciones para las salas');
    console.log('   - Los precios se calculan automáticamente según tipo de sala');
    console.log('   - Subir a producción cuando estés listo');

  } catch (error) {
    console.error('❌ Error al poblar datos:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

poblarDatosIniciales();
