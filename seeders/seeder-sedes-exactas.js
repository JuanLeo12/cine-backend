// Seeder para las 17 sedes exactas de Cinestar
const { Sede } = require('../models');

const sedesExactas = [
  // Primera fila de imágenes
  { nombre: 'ARENALES', direccion: 'Arenales 1756 - Centro comercial Arenales - 5to piso', ciudad: 'Lima' },
  { nombre: 'SUR', direccion: 'Av. los Héroes 240, San Juan de Miraflores 15801', ciudad: 'Lima' },
  { nombre: 'CHOSICA', direccion: 'Ca.Argentina, Sub Lote 02, parte del Potrero Sauce Grande, Lurigancho-Chosica 15472', ciudad: 'Lima' },
  { nombre: 'TINGO MARÍA', direccion: 'Cajamarca 901, Tingo María 10131', ciudad: 'Huánuco' },
  { nombre: 'TARAPOTO', direccion: 'Av. Perú 594, Tarapoto 22201', ciudad: 'San Martín' },
  { nombre: 'SULLANA', direccion: 'Marcelino Champagnat 1112, Sullana 20100', ciudad: 'Piura' },
  
  // Segunda fila de imágenes
  { nombre: 'CHIMBOTE', direccion: 'Av. Francisco Bolognesi 277, Chimbote 02803', ciudad: 'Áncash' },
  { nombre: 'PORTEÑO', direccion: 'Av Saenz Peña 342, Callao 07021', ciudad: 'Callao' },
  { nombre: 'EXCELSIOR', direccion: 'Jirón de la Unión Nº 780 - Cercado de Lima', ciudad: 'Lima' },
  { nombre: 'AYACUCHO', direccion: 'Jr. Grau No. 279 esquina con Jr. Carlos F. Vivanco Ayacucho', ciudad: 'Ayacucho' },
  { nombre: 'ILO', direccion: 'Av. La Costanera 12, Ilo', ciudad: 'Moquegua' },
  { nombre: 'MOQUEGUA', direccion: 'Av. Circunvalación N°1A - 1 Moquegua', ciudad: 'Moquegua' },
  
  // Tercera fila de imágenes
  { nombre: 'COMAS', direccion: 'Av Tupac Amaru Cuadra 39 S/N - La Pascana (Altura de Plaza Vea)', ciudad: 'Lima' },
  { nombre: 'SJL', direccion: 'Av. Los Próceres de la Independencia 1632 - San Juan de Lurigancho', ciudad: 'Lima' },
  { nombre: 'BREÑA', direccion: 'Jr. Iquique Nº 315 - Breña Av. Alfonso Ugarte y Venezuela', ciudad: 'Lima' },
  { nombre: 'CHORRILLOS SP', direccion: 'AV. GUARDIA CIVIL 390 URB. PARCELACIÓN SEMI RÚSTICA LA CAMPIÑA', ciudad: 'Lima' },
  { nombre: 'UNI', direccion: 'Av. Gerardo Unger sin cuadra 16 – Rímac (Altura de Metro)', ciudad: 'Lima' }
];

async function seedSedesExactas() {
  try {
    console.log('🎬 Iniciando seeder de sedes exactas...');

    // Primero, inactivar todas las sedes existentes
    await Sede.update(
      { estado: 'inactivo' },
      { where: {} }
    );
    console.log('✅ Sedes existentes inactivadas');

    // Insertar o actualizar las 17 sedes exactas
    for (const sedeData of sedesExactas) {
      const [sede, created] = await Sede.findOrCreate({
        where: { nombre: sedeData.nombre },
        defaults: { ...sedeData, estado: 'activo' }
      });

      if (!created) {
        await sede.update({ ...sedeData, estado: 'activo' });
        console.log(`✅ Sede actualizada: ${sedeData.nombre}`);
      } else {
        console.log(`✅ Sede creada: ${sedeData.nombre}`);
      }
    }

    console.log(`\n🎉 Proceso completado: ${sedesExactas.length} sedes activas`);
    console.log('📋 Sedes disponibles:');
    sedesExactas.forEach((sede, index) => {
      console.log(`   ${index + 1}. ${sede.nombre} - ${sede.ciudad}`);
    });

  } catch (error) {
    console.error('❌ Error en seeder:', error);
    throw error;
  }
}

// Ejecutar si se corre directamente
if (require.main === module) {
  const { sequelize } = require('../config/db');
  
  seedSedesExactas()
    .then(() => {
      console.log('\n✅ Seeder ejecutado correctamente');
      return sequelize.close();
    })
    .catch((error) => {
      console.error('\n❌ Error ejecutando seeder:', error);
      process.exit(1);
    });
}

module.exports = { seedSedesExactas, sedesExactas };
