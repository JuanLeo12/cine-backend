const { Sede, Sala } = require('./models');

const sedesReales = [
  // Lima - Centro
  { nombre: 'CINESTAR ARENALES', direccion: 'Arenales 1756 - Centro comercial Arenales - 5to piso', ciudad: 'Lima', estado: 'activo' },
  { nombre: 'CINESTAR EXCELSIOR', direccion: 'Jirón de la Unión Nº 780 - Cercado de Lima', ciudad: 'Lima', estado: 'activo' },
  { nombre: 'CINESTAR CENTRO CÍVICO', direccion: 'Jr. Huanta 150, Lima', ciudad: 'Lima', estado: 'activo' },
  
  // Lima - Norte
  { nombre: 'CINESTAR PLAZA NORTE', direccion: 'Av. Alfredo Mendiola 1400, Independencia', ciudad: 'Lima', estado: 'activo' },
  { nombre: 'CINESTAR LOS OLIVOS', direccion: 'Av. La Costanera 12, Ilo', ciudad: 'Lima', estado: 'activo' },
  { nombre: 'CINESTAR COMAS', direccion: 'Av.Tupac Amaru Cuadra 39 S/N - La Pascana (Altura de Plaza Vea)', ciudad: 'Lima', estado: 'activo' },
  
  // Lima - Sur
  { nombre: 'CINESTAR SUR', direccion: 'Av. los Héroes 240, San Juan de Miraflores 15801', ciudad: 'Lima', estado: 'activo' },
  { nombre: 'CINESTAR MALL DEL SUR', direccion: 'Av. Caminos del Inca 1311, San Juan de Miraflores', ciudad: 'Lima', estado: 'activo' },
  { nombre: 'CINESTAR BREÑA', direccion: 'Av. Iquique Nº 315 - Breña Av. Alfonso Ugarte y Venezuela', ciudad: 'Lima', estado: 'activo' },
  { nombre: 'CINESTAR CHORRILLOS', direccion: 'AV. GUARDIA CIVIL 390 URB. PARCELACION SEMI RUSTICA LA CAMPIÑA', ciudad: 'Lima', estado: 'activo' },
  
  // Lima - Este
  { nombre: 'CINESTAR SAN JUAN DE LURIGANCHO', direccion: 'Av. Próceres de la Independencia 1632, San Juan de Lurigancho', ciudad: 'Lima', estado: 'activo' },
  { nombre: 'CINESTAR MOQUEGUA', direccion: 'Av. Circunvalación Nº1A - 1 Moquegua', ciudad: 'Lima', estado: 'activo' },
  { nombre: 'CINESTAR AYACUCHO', direccion: 'Jr. Grau Nro. 279 esquina con Jr. Carlos F. Vivanco Ayacucho', ciudad: 'Lima', estado: 'activo' },
  
  // Lima - Otros distritos
  { nombre: 'CINESTAR JOCKEY PLAZA', direccion: 'Av. Javier Prado Este 4200, Santiago de Surco', ciudad: 'Lima', estado: 'activo' },
  { nombre: 'CINESTAR LAS AMÉRICAS', direccion: 'Av. Aviación 2405, San Borja', ciudad: 'Lima', estado: 'activo' },
  { nombre: 'CINESTAR PORTEÑO', direccion: 'Av Saenz Peña 342, Callao 07021', ciudad: 'Callao', estado: 'activo' },
  { nombre: 'CINESTAR CHIMBOTE', direccion: 'Av. Francisco Bolognesi 277, Chimbote 02803', ciudad: 'Ancash', estado: 'activo' },
  
  // Provincias
  { nombre: 'CINESTAR SULLANA', direccion: 'Marcelino Champagnat 1112, Sullana 20100', ciudad: 'Piura', estado: 'activo' },
  { nombre: 'CINESTAR TARAPOTO', direccion: 'Av. Perú 594, Tarapoto 22201', ciudad: 'San Martín', estado: 'activo' },
  { nombre: 'CINESTAR TINGO MARÍA', direccion: 'Cajamarca 901, Tingo María 10131', ciudad: 'Huánuco', estado: 'activo' },
  { nombre: 'CINESTAR CHOSICA', direccion: 'Ca Argentina, Sub Lote 02, parte del Potrero Sauce Grande, Lurigancho-Chosica', ciudad: 'Lima', estado: 'activo' },
  { nombre: 'CINESTAR UNI', direccion: 'Av. Gerardo Unger s/n cuadra 16 – Rímac (Altura de Metro)', ciudad: 'Lima', estado: 'activo' }
];

async function actualizarSedes() {
  try {
    console.log('🔄 Actualizando sedes de Cinestar...\n');

    // Eliminar sedes antiguas
    await Sede.destroy({ where: {} });
    console.log('✅ Sedes antiguas eliminadas');

    // Insertar nuevas sedes
    for (const sedeData of sedesReales) {
      const sede = await Sede.create(sedeData);
      
      // Crear 3 salas por sede con diferentes capacidades
      await Sala.create({
        nombre: 'Sala 1 - IMAX',
        filas: 12,
        columnas: 16,
        id_sede: sede.id,
        estado: 'activa'
      });

      await Sala.create({
        nombre: 'Sala 2 - 3D',
        filas: 10,
        columnas: 14,
        id_sede: sede.id,
        estado: 'activa'
      });

      await Sala.create({
        nombre: 'Sala 3 - 2D',
        filas: 8,
        columnas: 12,
        id_sede: sede.id,
        estado: 'activa'
      });

      console.log(`✅ ${sede.nombre} - ${sede.ciudad}`);
    }

    console.log(`\n✅ Total: ${sedesReales.length} sedes actualizadas`);
    console.log(`✅ Total: ${sedesReales.length * 3} salas creadas`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

actualizarSedes();
