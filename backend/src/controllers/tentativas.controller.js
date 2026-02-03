const { query } = require('../config/database');

const TABLE = 'lovable.pf_tentativas';
const ALUNOS_TABLE = 'lovable.pf_alunos';

// Get all tentativas
exports.getAll = async (req, res) => {
    try {
        const { matricula } = req.query;

        let sql = `SELECT * FROM ${TABLE}`;
        const params = [];

        if (matricula) {
            sql += ' WHERE matricula = $1';
            params.push(matricula);
        }

        sql += ' ORDER BY data_tentativa DESC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching tentativas:', error);
        res.status(500).json({ error: 'Erro ao buscar tentativas' });
    }
};

// Get tentativas count by matricula
exports.getCount = async (req, res) => {
    try {
        const { matricula } = req.params;

        const result = await query(
            `SELECT COUNT(*) as count FROM ${TABLE} WHERE matricula = $1`,
            [matricula]
        );

        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Error counting tentativas:', error);
        res.status(500).json({ error: 'Erro ao contar tentativas' });
    }
};

// Create new tentativa
    exports.create = async (req, res) => {
    try {
        const { matricula, data_possivel_plantao, data_que_conseguiu } = req.body;

        if (!matricula || !data_possivel_plantao) {
            return res.status(400).json({ error: 'Matrícula e data possível são obrigatórios' });
        }

        // Get student data
        const alunoResult = await query(
            `SELECT nome, telefone FROM ${ALUNOS_TABLE} WHERE matricula = $1`,
            [matricula]
        );

        if (alunoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        const aluno = alunoResult.rows[0];

        // Get current date in São Paulo timezone (GMT-3) in dd/mm/yyyy format
        const now = new Date();
        const spDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const data_tentativa = `${String(spDate.getDate()).padStart(2, '0')}/${String(spDate.getMonth() + 1).padStart(2, '0')}/${spDate.getFullYear()}`;

        // Insert tentativa
        const result = await query(
            `INSERT INTO ${TABLE} (matricula, nome, telefone, data_tentativa, data_possivel_plantao, data_que_conseguiu)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [matricula, aluno.nome, aluno.telefone, data_tentativa, data_possivel_plantao, data_que_conseguiu]
        );

        // Increment qtd_tentativas in pf_alunos
        await query(
            `UPDATE ${ALUNOS_TABLE} 
       SET qtd_tentativas = COALESCE(qtd_tentativas, 0) + 1 
       WHERE matricula = $1`,
            [matricula]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating tentativa:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ error: 'Tentativa já registrada para esta data' });
        }
        res.status(500).json({ error: 'Erro ao criar tentativa' });
    }
};

// Delete tentativa
exports.delete = async (req, res) => {
    try {
        const { matricula, data_tentativa, data_possivel_plantao } = req.params;

        const result = await query(
            `DELETE FROM ${TABLE} 
       WHERE matricula = $1 AND data_tentativa = $2 AND data_possivel_plantao = $3
       RETURNING *`,
            [matricula, data_tentativa, data_possivel_plantao]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tentativa não encontrada' });
        }

        // Decrement qtd_tentativas in pf_alunos
        await query(
            `UPDATE ${ALUNOS_TABLE} 
       SET qtd_tentativas = GREATEST(COALESCE(qtd_tentativas, 0) - 1, 0) 
       WHERE matricula = $1`,
            [matricula]
        );

        res.json({ message: 'Tentativa removida com sucesso', tentativa: result.rows[0] });
    } catch (error) {
        console.error('Error deleting tentativa:', error);
        res.status(500).json({ error: 'Erro ao remover tentativa' });
    }
};
