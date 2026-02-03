const { query, TABLES } = require('../config/database');

const TABLE = TABLES.PLANTOES; // lovable.pf_plantoes
const ALUNOS_TABLE = TABLES.ALUNOS;

// Listar todos os plantões
exports.getAll = async (req, res) => {
    try {
        const { status, matricula, data_plantao } = req.query;
        let sql = `SELECT * FROM ${TABLE}`;
        const params = [];
        const conditions = [];

        if (status) {
            conditions.push(`status = $${params.length + 1}`);
            params.push(status);
        }

        if (matricula) {
            conditions.push(`matricula = $${params.length + 1}`);
            params.push(matricula);
        }

        if (data_plantao) {
            conditions.push(`data_plantao = $${params.length + 1}`);
            params.push(data_plantao);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY data_plantao DESC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching plantoes:', error);
        res.status(500).json({ error: 'Erro ao buscar plantões' });
    }
};

// Criar novo plantão (Marcar)
exports.create = async (req, res) => {
    try {
        const {
            matricula, data_plantao, status
        } = req.body;

        if (!matricula || !data_plantao) {
            return res.status(400).json({ error: 'Matrícula e Data do Plantão são obrigatórios' });
        }

        // Buscar dados do aluno para preencher nome e telefone
        const alunoResult = await query(`SELECT nome, telefone FROM ${ALUNOS_TABLE} WHERE matricula = $1`, [matricula]);

        if (alunoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        // Verificar limite de plantões para o dia (Máximo 10)
        const countResult = await query(`SELECT COUNT(*) as total FROM ${TABLE} WHERE data_plantao = $1`, [data_plantao]);
        const totalPlantoes = parseInt(countResult.rows[0].total);

        if (totalPlantoes >= 10) {
            return res.status(400).json({ error: 'Limite de 10 plantões para este dia já foi atingido.' });
        }

        const { nome, telefone } = alunoResult.rows[0];
        const data_marcado = new Date().toISOString().split('T')[0]; // Data de hoje

        const sql = `
      INSERT INTO ${TABLE} 
      (matricula, nome, telefone, data_plantao, data_marcado, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

        const result = await query(sql, [
            matricula, nome, telefone, data_plantao, data_marcado,
            status || 'Em Aberto'
        ]);

        // Atualizar contador de plantões do aluno? 
        // O requisito diz: "qtd_plantoes ... count de quantas linhas da outra table ele tem"
        // Podemos atualizar isso aqui ou calcular na leitura. 
        // O requisito diz "onde deve ser mostrado ... alem da quantidade de plantoes que ele já marcou previamente (count de quantas linhas da outra table ele tem)"
        // Se a coluna qtd_plantoes existe na tabela pf_alunos, é provável que seja um cache/counter.
        // Vou incrementar aqui para manter sincronizado.

        await query(`UPDATE ${ALUNOS_TABLE} SET qtd_plantoes = (qtd_plantoes + 1) WHERE matricula = $1`, [matricula]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ [Plantoes] Erro ao criar plantão:', error.message);

        if (error.code === '23505') {
            res.status(400).json({
                error: 'Já existe um plantão marcado para este aluno nesta data',
                details: error.detail
            });
        } else {
            res.status(500).json({ error: 'Erro ao criar plantão', details: error.message });
        }
    }
};

// Atualizar status do plantão
exports.updateStatus = async (req, res) => {
    try {
        const { matricula, data_plantao } = req.params; // Composite key identifier?
        // Usually REST uses ID. But this table has composite PK (matricula, data_plantao).
        // I'll assume the frontend sends both or I can use a query param.
        // Let's expect them in body or params. Since data_plantao can have slashes, maybe body is safer or encoded URL.
        // However, for simplicity, let's assume we pass them in body for update, or use a query.
        // Or maybe I should add an ID column? The schema provided didn't have ID.
        // "CONSTRAINT pf_plantoes_unique UNIQUE (matricula, data_plantao)"
        // It doesn't explicitly say there is no ID, but it defines a unique constraint.
        // I'll use matricula and data_plantao to identify.

        // Wait, express params usually work like /plantoes/:matricula/:data_plantao

        const { status } = req.body;

        const sql = `
      UPDATE ${TABLE} SET status = $1
      WHERE matricula = $2 AND data_plantao = $3
      RETURNING *
    `;

        const result = await query(sql, [status, matricula, data_plantao]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plantão não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating plantao:', error);
        res.status(500).json({ error: 'Erro ao atualizar plantão' });
    }
};

// Deletar plantão
exports.delete = async (req, res) => {
    try {
        const { matricula, data_plantao } = req.params;

        const result = await query(`DELETE FROM ${TABLE} WHERE matricula = $1 AND data_plantao = $2 RETURNING *`, [matricula, data_plantao]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plantão não encontrado' });
        }

        // Decrementar contador
        await query(`UPDATE ${ALUNOS_TABLE} SET qtd_plantoes = (qtd_plantoes - 1) WHERE matricula = $1`, [matricula]);

        res.json({ message: 'Plantão deletado com sucesso', plantao: result.rows[0] });
    } catch (error) {
        console.error('Error deleting plantao:', error);
        res.status(500).json({ error: 'Erro ao deletar plantão' });
    }
};
