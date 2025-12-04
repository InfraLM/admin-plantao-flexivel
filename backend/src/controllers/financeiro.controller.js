const { query, TABLES } = require('../config/database');
const crypto = require('crypto');

const TABLE = TABLES.FINANCEIRO; // ci_financeiro

// Função para gerar ID único
const generateId = () => crypto.randomUUID();

// Listar todos os registros
exports.getAll = async (req, res) => {
  try {
    const { search, tipo, turma_id } = req.query;
    let sql = `SELECT * FROM ${TABLE}`;
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(categoria ILIKE $${params.length + 1} OR descricao ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (tipo && tipo !== 'todos') {
      conditions.push(`tipo = $${params.length + 1}`);
      params.push(tipo);
    }

    if (turma_id) {
      if (turma_id === 'sem_turma') {
        conditions.push('turma_id IS NULL');
      } else {
        conditions.push(`turma_id = $${params.length + 1}`);
        params.push(turma_id);
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY data DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching financeiro:', error);
    res.status(500).json({ error: 'Erro ao buscar registros financeiros' });
  }
};

// Obter resumo financeiro
exports.getResumo = async (req, res) => {
  try {
    const { turma_id, data_inicio, data_fim } = req.query;
    
    let sql = `
      SELECT 
        tipo,
        SUM(CAST(valor_total AS DECIMAL(10,2))) as total
      FROM ${TABLE}
    `;
    const params = [];
    const conditions = [];

    if (turma_id) {
      conditions.push(`turma_id = $${params.length + 1}`);
      params.push(turma_id);
    }

    if (data_inicio) {
      conditions.push(`data >= $${params.length + 1}`);
      params.push(data_inicio);
    }

    if (data_fim) {
      conditions.push(`data <= $${params.length + 1}`);
      params.push(data_fim);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY tipo';

    const result = await query(sql, params);
    
    const resumo = {
      entradas: 0,
      saidas: 0,
      saldo: 0
    };

    result.rows.forEach(row => {
      if (row.tipo === 'Entrada') {
        resumo.entradas = parseFloat(row.total) || 0;
      } else if (row.tipo === 'Saída') {
        resumo.saidas = parseFloat(row.total) || 0;
      }
    });

    resumo.saldo = resumo.entradas - resumo.saidas;

    res.json(resumo);
  } catch (error) {
    console.error('Error fetching resumo:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo financeiro' });
  }
};

// Buscar registro por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching registro:', error);
    res.status(500).json({ error: 'Erro ao buscar registro' });
  }
};

// Criar novo registro
exports.create = async (req, res) => {
  try {
    const {
      categoria, descricao, quantidade, valor_unitario,
      valor_total, tipo, data, turma_id, observacoes
    } = req.body;

    // Gerar ID único
    const id = generateId();

    // Calcular valor_total se não fornecido
    const calculatedTotal = valor_total || 
      (parseFloat(quantidade || 1) * parseFloat(valor_unitario || 0)).toFixed(2);

    const today = new Date().toISOString().split('T')[0];

    const sql = `
      INSERT INTO ${TABLE} 
      (id, categoria, descricao, quantidade, valor_unitario, valor_total, tipo, data, turma_id, observacoes, data_registro)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await query(sql, [
      id, categoria, descricao || '', quantidade || '1', valor_unitario,
      calculatedTotal, tipo, data, turma_id || null, observacoes || '', today
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ [Financeiro] Erro ao criar registro:', error.message);
    console.error('   Código:', error.code);
    
    if (error.code === '23502') {
      res.status(400).json({ 
        error: 'Campo obrigatório não preenchido',
        details: error.message
      });
    } else {
      res.status(500).json({ error: 'Erro ao criar registro', details: error.message });
    }
  }
};

// Atualizar registro
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoria, descricao, quantidade, valor_unitario,
      valor_total, tipo, data, turma_id, observacoes
    } = req.body;

    const sql = `
      UPDATE ${TABLE} SET
        categoria = $1, descricao = $2, quantidade = $3, valor_unitario = $4,
        valor_total = $5, tipo = $6, data = $7, turma_id = $8, observacoes = $9
      WHERE id = $10
      RETURNING *
    `;

    const result = await query(sql, [
      categoria, descricao, quantidade, valor_unitario,
      valor_total, tipo, data, turma_id || null, observacoes, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating registro:', error);
    res.status(500).json({ error: 'Erro ao atualizar registro' });
  }
};

// Atualizar campo específico
exports.updateField = async (req, res) => {
  try {
    const { id } = req.params;
    const { field, value } = req.body;

    const allowedFields = [
      'categoria', 'descricao', 'quantidade', 'valor_unitario',
      'valor_total', 'tipo', 'data', 'turma_id', 'observacoes'
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Campo não permitido para atualização' });
    }

    // Se atualizar quantidade ou valor_unitario, recalcular valor_total
    let sql;
    let params;

    if (field === 'quantidade' || field === 'valor_unitario') {
      sql = `
        UPDATE ${TABLE} SET 
          ${field} = $1,
          valor_total = (
            CASE 
              WHEN '${field}' = 'quantidade' THEN CAST($1 AS DECIMAL) * CAST(valor_unitario AS DECIMAL)
              ELSE CAST(quantidade AS DECIMAL) * CAST($1 AS DECIMAL)
            END
          )::TEXT
        WHERE id = $2 
        RETURNING *
      `;
      params = [value, id];
    } else {
      sql = `UPDATE ${TABLE} SET ${field} = $1 WHERE id = $2 RETURNING *`;
      params = [value, id];
    }

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating registro field:', error);
    res.status(500).json({ error: 'Erro ao atualizar campo do registro' });
  }
};

// Deletar registro
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.json({ message: 'Registro deletado com sucesso', registro: result.rows[0] });
  } catch (error) {
    console.error('Error deleting registro:', error);
    res.status(500).json({ error: 'Erro ao deletar registro' });
  }
};

// Buscar por tipo
exports.getByTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    const result = await query(`SELECT * FROM ${TABLE} WHERE tipo = $1 ORDER BY data DESC`, [tipo]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching by tipo:', error);
    res.status(500).json({ error: 'Erro ao buscar por tipo' });
  }
};
