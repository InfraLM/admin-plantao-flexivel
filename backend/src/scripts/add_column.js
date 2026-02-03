require('dotenv').config({ path: '../../.env' });
const { query } = require('../config/database');

async function migrate() {
    try {
        console.log('Verificando coluna data_que_conseguiu na tabela pf_tentativas...');
        
        // Check if column exists
        const check = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'lovable' 
            AND table_name = 'pf_tentativas' 
            AND column_name = 'data_que_conseguiu';
        `);

        if (check.rows.length === 0) {
            console.log('Coluna não existe. Adicionando...');
            await query(`
                ALTER TABLE lovable.pf_tentativas 
                ADD COLUMN data_que_conseguiu VARCHAR(20);
            `);
            console.log('Coluna adicionada com sucesso!');
        } else {
            console.log('Coluna já existe.');
        }
        
    } catch (error) {
        console.error('Erro na migração:', error);
    }
}

migrate();
