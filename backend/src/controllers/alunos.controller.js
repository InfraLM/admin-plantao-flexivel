const { query, TABLES } = require('../config/database');
const crypto = require('crypto');

const TABLE = TABLES.ALUNOS; // ci_alunos_pacientes

// Função para gerar ID único
const generateId = () => crypto.randomUUID();

// Listar todos os alunos
exports.getAll = async (req, res) => {
  try {
    const { search, status, vendedor } = req.query;
    let sql = `SELECT * FROM ${TABLE}`;
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(nome ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1} OR cpf ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (vendedor) {
      conditions.push(`vendedor = $${params.length + 1}`);
      params.push(vendedor);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY data_matricula DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alunos:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos' });
  }
};

// Buscar aluno por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching aluno:', error);
    res.status(500).json({ error: 'Erro ao buscar aluno' });
  }
};

// Criar novo aluno
exports.create = async (req, res) => {
  try {
    const {
      nome, email, telefone, data_nascimento, cpf, endereco,
      status, data_matricula, observacoes, vendedor, valor_venda,
      parcelas, pos_graduacao
    } = req.body;

    // Gerar ID único
    const id = generateId();

    const sql = `
      INSERT INTO ${TABLE} 
      (id, nome, email, telefone, data_nascimento, cpf, endereco, status, 
       data_matricula, observacoes, vendedor, valor_venda, parcelas, pos_graduacao, data_cadastro)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const today = new Date().toISOString().split('T')[0];

    const result = await query(sql, [
      id, nome, email, telefone, data_nascimento, cpf, endereco,
      status || 'Em Onboarding', data_matricula, observacoes || '',
      vendedor, valor_venda, parcelas, pos_graduacao || false, today
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ [Alunos] Erro ao criar aluno:', error.message);
    console.error('   Código:', error.code);
    
    if (error.code === '23502') {
      res.status(400).json({ 
        error: 'Campo obrigatório não preenchido',
        details: error.message
      });
    } else if (error.code === '23505') {
      res.status(400).json({ 
        error: 'Este email já está cadastrado',
        details: 'Use um email diferente'
      });
    } else {
      res.status(500).json({ error: 'Erro ao criar aluno', details: error.message });
    }
  }
};

// Atualizar aluno
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, email, telefone, data_nascimento, cpf, endereco,
      status, data_matricula, observacoes, vendedor, valor_venda,
      parcelas, pos_graduacao
    } = req.body;

    const sql = `
      UPDATE ${TABLE} SET
        nome = $1, email = $2, telefone = $3, data_nascimento = $4,
        cpf = $5, endereco = $6, status = $7, data_matricula = $8,
        observacoes = $9, vendedor = $10, valor_venda = $11,
        parcelas = $12, pos_graduacao = $13
      WHERE id = $14
      RETURNING *
    `;

    const result = await query(sql, [
      nome, email, telefone, data_nascimento, cpf, endereco,
      status, data_matricula, observacoes, vendedor, valor_venda,
      parcelas, pos_graduacao, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating aluno:', error);
    res.status(500).json({ error: 'Erro ao atualizar aluno' });
  }
};

// Atualizar campo específico
exports.updateField = async (req, res) => {
  try {
    const { id } = req.params;
    const { field, value } = req.body;

    // Campos permitidos para atualização
    const allowedFields = [
      'nome', 'email', 'telefone', 'data_nascimento', 'cpf', 'endereco',
      'status', 'observacoes', 'vendedor', 'valor_venda', 'parcelas', 'pos_graduacao'
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Campo não permitido para atualização' });
    }

    const sql = `UPDATE ${TABLE} SET ${field} = $1 WHERE id = $2 RETURNING *`;
    const result = await query(sql, [value, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating aluno field:', error);
    res.status(500).json({ error: 'Erro ao atualizar campo do aluno' });
  }
};

// Deletar aluno
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    res.json({ message: 'Aluno deletado com sucesso', aluno: result.rows[0] });
  } catch (error) {
    console.error('Error deleting aluno:', error);
    res.status(500).json({ error: 'Erro ao deletar aluno' });
  }
};

// Buscar por status
exports.getByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const result = await query(`SELECT * FROM ${TABLE} WHERE status = $1 ORDER BY nome`, [status]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alunos by status:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos por status' });
  }
};

// Buscar por vendedor
exports.getByVendedor = async (req, res) => {
  try {
    const { vendedor } = req.params;
    const result = await query(`SELECT * FROM ${TABLE} WHERE vendedor = $1 ORDER BY data_matricula DESC`, [vendedor]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alunos by vendedor:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos por vendedor' });
  }
};
