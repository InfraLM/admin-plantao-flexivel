const { query, TABLES } = require('../config/database');

const TABLE = TABLES.ALUNOS; // lovable.pf_alunos

// Listar todos os alunos
exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `SELECT * FROM ${TABLE}`;
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(nome ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1} OR matricula ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY nome ASC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alunos:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos' });
  }
};

// Buscar aluno por Matricula (PK)
exports.getById = async (req, res) => {
  try {
    const { id } = req.params; // id here is matricula
    const result = await query(`SELECT * FROM ${TABLE} WHERE matricula = $1`, [id]);

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
// Criar novo aluno
exports.create = async (req, res) => {
  try {
    const {
      matricula, nome, telefone, email,
      qtd_plantoes, data_ultimo_plantao,
      parcelas_pagas, parcelas_atraso, parcelas_aberto,
      aulas_total_porcentagem, aulas_assistidas,
      dias_desde_primeira_aula, dias_desde_ultima_aula,
      turma, criado_em, status_financeiro, qtd_tentativas,
      cidade, tag
    } = req.body;

    if (!matricula) {
      return res.status(400).json({ error: 'Matrícula é obrigatória' });
    }

    const sql = `
      INSERT INTO ${TABLE} 
      (matricula, nome, telefone, email, qtd_plantoes, data_ultimo_plantao, 
       parcelas_pagas, parcelas_atraso, parcelas_aberto, aulas_total_porcentagem, aulas_assistidas,
       dias_desde_primeira_aula, dias_desde_ultima_aula, turma, criado_em, status_financeiro, qtd_tentativas,
       cidade, tag)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `;

    const result = await query(sql, [
      matricula, nome, telefone, email,
      qtd_plantoes || 0, data_ultimo_plantao || null,
      parcelas_pagas || 0, parcelas_atraso || 0, parcelas_aberto || 0,
      aulas_total_porcentagem || 0.0, aulas_assistidas || 0,
      dias_desde_primeira_aula || 0, dias_desde_ultima_aula || 0,
      turma || null, criado_em || null, status_financeiro || 'INDEFINIDO', qtd_tentativas || 0,
      cidade || null, tag || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ [Alunos] Erro ao criar aluno:', error.message);

    if (error.code === '23505') {
      res.status(400).json({
        error: 'Esta matrícula já está cadastrada',
        details: 'Use uma matrícula diferente'
      });
    } else {
      res.status(500).json({ error: 'Erro ao criar aluno', details: error.message });
    }
  }
};

// Atualizar aluno
exports.update = async (req, res) => {
  try {
    const { id } = req.params; // matricula
    const {
      nome, telefone, email,
      qtd_plantoes, data_ultimo_plantao,
      parcelas_pagas, parcelas_atraso, parcelas_aberto,
      aulas_total_porcentagem,
      cidade, tag
    } = req.body;

    const sql = `
      UPDATE ${TABLE} SET
        nome = $1, telefone = $2, email = $3,
        qtd_plantoes = $4, data_ultimo_plantao = $5,
        parcelas_pagas = $6, parcelas_atraso = $7, parcelas_aberto = $8,
        aulas_total_porcentagem = $9,
        cidade = $10, tag = $11
      WHERE matricula = $12
      RETURNING *
    `;

    const result = await query(sql, [
      nome, telefone, email,
      qtd_plantoes, data_ultimo_plantao,
      parcelas_pagas, parcelas_atraso, parcelas_aberto,
      aulas_total_porcentagem,
      cidade, tag,
      id
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
    const { id } = req.params; // matricula
    const { field, value } = req.body;

    // Campos permitidos para atualização
    const allowedFields = [
      'nome', 'telefone', 'email',
      'qtd_plantoes', 'data_ultimo_plantao',
      'parcelas_pagas', 'parcelas_atraso', 'parcelas_aberto',
      'aulas_total_porcentagem',
      'cidade', 'tag'
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Campo não permitido para atualização' });
    }

    const sql = `UPDATE ${TABLE} SET ${field} = $1 WHERE matricula = $2 RETURNING *`;
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
    const { id } = req.params; // matricula
    const result = await query(`DELETE FROM ${TABLE} WHERE matricula = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    res.json({ message: 'Aluno deletado com sucesso', aluno: result.rows[0] });
  } catch (error) {
    console.error('Error deleting aluno:', error);
    res.status(500).json({ error: 'Erro ao deletar aluno' });
  }
};
