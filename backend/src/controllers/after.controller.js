const { query, TABLES } = require('../config/database');

const TABLE = 'lovable.pf_after';
const PLANTOES_TABLE = TABLES.PLANTOES;

// Get all after records
exports.getAll = async (req, res) => {
    try {
        const { matricula } = req.query;

        let sql = `SELECT * FROM ${TABLE}`;
        const params = [];

        if (matricula) {
            sql += ' WHERE matricula = $1';
            params.push(matricula);
        }

        sql += ' ORDER BY data_plantao DESC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching after records:', error);
        res.status(500).json({ error: 'Erro ao buscar registros' });
    }
};

// Get after record by matricula and data
exports.getById = async (req, res) => {
    try {
        const { matricula, data_plantao } = req.params;

        const result = await query(
            `SELECT * FROM ${TABLE} WHERE matricula = $1 AND data_plantao = $2`,
            [matricula, data_plantao]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching after record:', error);
        res.status(500).json({ error: 'Erro ao buscar registro' });
    }
};

// Create after record and update plantao status
exports.create = async (req, res) => {
    try {
        const {
            matricula,
            nome,
            telefone,
            data_plantao,
            uti,
            cvc,
            pai,
            cardioversao,
            iot,
            dreno,
            sne_svd,
            protocolos_avc,
            paracentese,
            prona,
            marca_passo,
            extubacao,
            decanulacao,
            retirada_dreno,
            toracocentese,
            traqueostomia,
            puncao_liquorica,
            cateter_hemodialise,
            protocolo_me,
            comparecimento
        } = req.body;

        if (!matricula || !data_plantao) {
            return res.status(400).json({ error: 'Matrícula e data do plantão são obrigatórios' });
        }

        // Insert after record
        const result = await query(
            `INSERT INTO ${TABLE} (
        matricula, nome, telefone, data_plantao, uti,
        cvc, pai, cardioversao, iot, dreno, sne_svd,
        protocolos_avc, paracentese, prona, marca_passo,
        extubacao, decanulacao, retirada_dreno, toracocentese,
        traqueostomia, puncao_liquorica, cateter_hemodialise,
        protocolo_me,
        comparecimento
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
            [
                matricula, nome, telefone, data_plantao, uti,
                cvc || false, pai || false, cardioversao || false,
                iot || false, dreno || false, sne_svd || false,
                protocolos_avc || false, paracentese || false,
                prona || false, marca_passo || false,
                extubacao || false, decanulacao || false, retirada_dreno || false,
                toracocentese || false, traqueostomia || false, puncao_liquorica || false,
                cateter_hemodialise || false, protocolo_me || false,
                comparecimento !== undefined ? comparecimento : true // Default to true if not provided
            ]
        );

        // Update plantao status based on attendance
        // If comparecimento is false, status = 'Cancelado' (Falta)
        // If comparecimento is true, status = 'Realizado'
        const newStatus = (comparecimento === false) ? 'Cancelado' : 'Realizado';

        await query(
            `UPDATE ${PLANTOES_TABLE} SET status = $1 WHERE matricula = $2 AND data_plantao = $3`,
            [newStatus, matricula, data_plantao]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating after record:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Registro já existe para este plantão' });
        }
        res.status(500).json({ error: 'Erro ao criar registro' });
    }
};

// Update after record
exports.update = async (req, res) => {
    try {
        const { matricula, data_plantao } = req.params;
        const updates = req.body;

        // Build dynamic update query
        const allowedFields = [
            'uti', 'cvc', 'pai', 'cardioversao', 'iot', 'dreno',
            'sne_svd', 'protocolos_avc', 'paracentese', 'prona', 'marca_passo',
            'extubacao', 'decanulacao', 'retirada_dreno', 'toracocentese',
            'traqueostomia', 'puncao_liquorica', 'cateter_hemodialise',
            'protocolo_me'
        ];

        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                setClauses.push(`${key} = $${paramIndex}`);
                values.push(updates[key]);
                paramIndex++;
            }
        });

        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
        }

        values.push(matricula, data_plantao);

        const result = await query(
            `UPDATE ${TABLE} SET ${setClauses.join(', ')} 
       WHERE matricula = $${paramIndex} AND data_plantao = $${paramIndex + 1}
       RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating after record:', error);
        res.status(500).json({ error: 'Erro ao atualizar registro' });
    }
};

// Delete after record
exports.delete = async (req, res) => {
    try {
        const { matricula, data_plantao } = req.params;

        const result = await query(
            `DELETE FROM ${TABLE} WHERE matricula = $1 AND data_plantao = $2 RETURNING *`,
            [matricula, data_plantao]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        // Optionally update plantao status back to Em Aberto
        await query(
            `UPDATE ${PLANTOES_TABLE} SET status = 'Em Aberto' WHERE matricula = $1 AND data_plantao = $2`,
            [matricula, data_plantao]
        );

        res.json({ message: 'Registro removido com sucesso', after: result.rows[0] });
    } catch (error) {
        console.error('Error deleting after record:', error);
        res.status(500).json({ error: 'Erro ao remover registro' });
    }
};
