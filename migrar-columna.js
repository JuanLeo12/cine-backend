const { sequelize } = require('./models');

async function migrar() {
    try {
        console.log('� Verificando estructura de la tabla...');
        
        // Verificar qué columnas existen
        const [columns] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'ordenes_tickets';
        `);
        
        const columnNames = columns.map(c => c.column_name);
        console.log('📋 Columnas actuales:', columnNames);
        
        const tieneUsuario = columnNames.includes('id_tipo_usuario');
        const tieneTicket = columnNames.includes('id_tipo_ticket');
        
        if (tieneUsuario && tieneTicket) {
            console.log('🗑️  Eliminando columna antigua id_tipo_usuario...');
            await sequelize.query(`
                ALTER TABLE ordenes_tickets 
                DROP COLUMN id_tipo_usuario;
            `);
            console.log('✅ Columna antigua eliminada');
        } else if (tieneUsuario && !tieneTicket) {
            console.log('🔄 Renombrando id_tipo_usuario → id_tipo_ticket...');
            await sequelize.query(`
                ALTER TABLE ordenes_tickets 
                RENAME COLUMN id_tipo_usuario TO id_tipo_ticket;
            `);
            console.log('✅ Columna renombrada');
        } else if (tieneTicket && !tieneUsuario) {
            console.log('✅ La tabla ya está correcta');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

migrar();
