const sequelize = require('./config/db');

async function agregarPreciosTiposTicket() {
    try {
        console.log('🔧 Agregando columna precio_base a tipo_ticket...');
        
        // Agregar columna
        await sequelize.query(`
            ALTER TABLE tipo_ticket 
            ADD COLUMN IF NOT EXISTS precio_base DECIMAL(10, 2) DEFAULT 12.50;
        `);
        
        console.log('✅ Columna agregada');
        
        // Actualizar precios específicos
        console.log('💰 Actualizando precios por tipo...');
        
        await sequelize.query(`
            UPDATE tipo_ticket SET precio_base = 12.50 WHERE nombre = 'Adulto';
        `);
        
        await sequelize.query(`
            UPDATE tipo_ticket SET precio_base = 8.00 WHERE nombre = 'Niño';
        `);
        
        await sequelize.query(`
            UPDATE tipo_ticket SET precio_base = 9.00 WHERE nombre = 'Adulto Mayor';
        `);
        
        await sequelize.query(`
            UPDATE tipo_ticket SET precio_base = 9.00 WHERE nombre = 'Conadis';
        `);
        
        console.log('✅ Precios actualizados:');
        console.log('   - Adulto: S/ 12.50');
        console.log('   - Niño: S/ 8.00');
        console.log('   - Adulto Mayor: S/ 9.00');
        console.log('   - Conadis: S/ 9.00');
        
        // Verificar
        const [tipos] = await sequelize.query('SELECT id, nombre, precio_base FROM tipo_ticket');
        console.log('\n📋 Tipos de ticket actualizados:');
        console.table(tipos);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

agregarPreciosTiposTicket();
