const { query } = require('../config/database');

const TABLE = 'lovable.pf_feedback';

exports.getAll = async (req, res) => {
    try {
        const result = await query(`SELECT * FROM ${TABLE} ORDER BY to_date("data", 'DD/MM/YYYY') DESC`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        res.status(500).json({ error: 'Erro ao buscar feedbacks' });
    }
};
