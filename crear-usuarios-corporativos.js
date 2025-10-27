/**
 * Script para crear usuarios corporativos de prueba
 * Ejecutar: node crear-usuarios-corporativos.js
 */

const { Usuario } = require('./models');

async function crearUsuariosCorporativos() {
    try {
        console.log('🏢 Creando usuarios corporativos...\n');

        const usuariosCorporativos = [
            {
                nombre: 'BCP',
                apellido: 'Corporativo',
                email: 'corporativo@bcp.com.pe',
                password: '123456',
                rol: 'corporativo',
                telefono: '016115959',
                ruc: '20100047218',
                representante: 'Juan Pérez',
                cargo: 'Gerente de RRHH',
                direccion: 'Av. Centenario 156, La Molina, Lima',
                estado: 'activo'
            },
            {
                nombre: 'Telefónica',
                apellido: 'Eventos',
                email: 'eventos@telefonica.com.pe',
                password: '123456',
                rol: 'corporativo',
                telefono: '016116000',
                ruc: '20109072177',
                representante: 'María García',
                cargo: 'Coordinadora de Eventos',
                direccion: 'Av. Arequipa 1155, Santa Beatriz, Lima',
                estado: 'activo'
            }
        ];

        for (const userData of usuariosCorporativos) {
            // Verificar si ya existe
            const existente = await Usuario.findOne({ where: { email: userData.email } });
            
            if (existente) {
                console.log(`⚠️  Usuario ${userData.email} ya existe (ID: ${existente.id})`);
                continue;
            }

            // Crear usuario
            const usuario = await Usuario.create(userData);
            console.log(`✅ Usuario creado: ${usuario.email} (ID: ${usuario.id})`);
            console.log(`   - Nombre: ${usuario.nombre} ${usuario.apellido}`);
            console.log(`   - RUC: ${usuario.ruc}`);
            console.log(`   - Rol: ${usuario.rol}`);
            console.log(`   - Password: 123456\n`);
        }

        console.log('✅ Proceso completado\n');
        console.log('📋 Resumen:');
        console.log('   Email: corporativo@bcp.com.pe | Password: 123456');
        console.log('   Email: eventos@telefonica.com.pe | Password: 123456');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al crear usuarios corporativos:', error);
        process.exit(1);
    }
}

crearUsuariosCorporativos();
