const { query, TABLES } = require('../config/database');
const crypto = require('crypto');

const TABLE = TABLES.TURMAS; // ci_turmas_tratamentos

// Função para gerar ID único
const generateId = () => crypto.randomUUID();

// Listar todas as turmas
exports.getAll = async (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = `SELECT 
      id, nome_turma as nome, descricao, data_inicio, data_fim, horario, 
      "local", capacidade, instrutor, status, valor
      FROM ${TABLE}`;
    const params = [];
    const conditions = [];

    console.log('📖 [Turmas] Buscando todas as turmas...');
    console.log('   Tabela:', TABLE);
    console.log('   Filtros:', { search, status });

    if (search) {
      conditions.push(`(nome_turma ILIKE $${params.length + 1} OR instrutor ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY data_inicio DESC';

    const result = await query(sql, params);
    console.log('✅ [Turmas] Encontradas', result.rows.length, 'turmas');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ [Turmas] Erro ao buscar turmas:', error.message);
    console.error('   Código:', error.code);
    console.error('   SQL:', error.query);
    
    // Mensagens de erro mais específicas
    if (error.code === '42P01') {
      res.status(500).json({ 
        error: 'Erro ao buscar turmas',
        details: `Tabela '${TABLE}' não existe no banco de dados`
      });
    } else if (error.code === '42703') {
      res.status(500).json({ 
        error: 'Erro na estrutura das colunas',
        details: error.message
      });
    } else if (error.code === 'ECONNREFUSED') {
      res.status(500).json({ 
        error: 'Erro ao conectar ao banco de dados',
        details: 'Verifique as credenciais e se o banco está acessível'
      });
    } else {
      res.status(500).json({ 
        error: 'Erro ao buscar turmas',
        details: error.message
      });
    }
  }
};

// Buscar turma por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching turma:', error);
    res.status(500).json({ error: 'Erro ao buscar turma' });
  }
};

// Criar nova turma
exports.create = async (req, res) => {
  try {
    const {
      nome, descricao, data_inicio, data_fim, horario,
      local, capacidade, instrutor, status, valor
    } = req.body;

    // Gerar ID único
    const id = generateId();

    console.log('📝 [Turmas] Criando nova turma...');
    console.log('   ID gerado:', id);
    console.log('   Dados recebidos:', {
      nome, descricao, data_inicio, data_fim, horario,
      local, capacidade, instrutor, status, valor
    });

    const sql = `
      INSERT INTO ${TABLE} 
      (id, nome_turma, descricao, data_inicio, data_fim, horario, "local", capacidade, instrutor, status, valor)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, nome_turma as nome, descricao, data_inicio, data_fim, horario, 
                "local", capacidade, instrutor, status, valor
    `;

    const result = await query(sql, [
      id, nome, descricao || '', data_inicio, data_fim, horario || '',
      local || '', capacidade || '10', instrutor, status || 'Aberta', valor
    ]);

    console.log('✅ [Turmas] Turma criada com sucesso:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ [Turmas] Erro ao criar turma:', error.message);
    console.error('   Código:', error.code);
    console.error('   Stack:', error.stack);
    
    // Mensagens de erro mais específicas
    if (error.code === '42P01') {
      res.status(500).json({ 
        error: 'Erro ao criar turma',
        details: `Tabela '${TABLE}' não existe no banco de dados`
      });
    } else if (error.code === '42703') {
      res.status(500).json({ 
        error: 'Erro na estrutura das colunas',
        details: error.message + ' - Verifique os nomes das colunas no banco'
      });
    } else if (error.code === '23505') {
      res.status(400).json({ 
        error: 'Esta turma já existe',
        details: 'Verifique se todos os dados estão corretos'
      });
    } else if (error.code === '23502') {
      res.status(400).json({ 
        error: 'Campo obrigatório não preenchido',
        details: error.message
      });
    } else {
      res.status(500).json({ 
        error: 'Erro ao criar turma',
        details: error.message
      });
    }
  }
};

// Atualizar turma
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, descricao, data_inicio, data_fim, horario,
      local, capacidade, instrutor, status, valor
    } = req.body;

    const sql = `
      UPDATE ${TABLE} SET
        nome_turma = $1, descricao = $2, data_inicio = $3, data_fim = $4,
        horario = $5, "local" = $6, capacidade = $7, instrutor = $8,
        status = $9, valor = $10
      WHERE id = $11
      RETURNING id, nome_turma as nome, descricao, data_inicio, data_fim, horario,
                "local", capacidade, instrutor, status, valor
    `;

    const result = await query(sql, [
      nome, descricao, data_inicio, data_fim, horario,
      local, capacidade, instrutor, status, valor, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating turma:', error);
    res.status(500).json({ error: 'Erro ao atualizar turma' });
  }
};

// Atualizar campo específico
exports.updateField = async (req, res) => {
  try {
    const { id } = req.params;
    const { field, value } = req.body;

    // Mapear campos do frontend para o banco de dados
    const fieldMapping = {
      'nome': 'nome_turma',
      'descricao': 'descricao',
      'data_inicio': 'data_inicio',
      'data_fim': 'data_fim',
      'horario': 'horario',
      'local': '"local"',
      'capacidade': 'capacidade',
      'instrutor': 'instrutor',
      'status': 'status',
      'valor': 'valor'
    };

    const dbField = fieldMapping[field];
    if (!dbField) {
      return res.status(400).json({ error: 'Campo não permitido para atualização' });
    }

    const sql = `UPDATE ${TABLE} SET ${dbField} = $1 WHERE id = $2 
                 RETURNING id, nome_turma as nome, descricao, data_inicio, data_fim, horario,
                           "local", capacidade, instrutor, status, valor`;
    const result = await query(sql, [value, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating turma field:', error);
    res.status(500).json({ error: 'Erro ao atualizar campo da turma' });
  }
};

// Deletar turma
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Turma não encontrada' });
    }

    res.json({ message: 'Turma deletada com sucesso', turma: result.rows[0] });
  } catch (error) {
    console.error('Error deleting turma:', error);
    res.status(500).json({ error: 'Erro ao deletar turma' });
  }
};

// Buscar alunos da turma
exports.getAlunos = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT a.*, at.data_inscricao, at.status as inscricao_status
      FROM ${TABLES.ALUNOS} a
      INNER JOIN ${TABLES.ALUNO_TURMA} at ON a.id = at.aluno_id
      WHERE at.turma_id = $1
      ORDER BY a.nome
    `;
    const result = await query(sql, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching turma alunos:', error);
    res.status(500).json({ error: 'Erro ao buscar alunos da turma' });
  }
};

// Buscar financeiro da turma
exports.getFinanceiro = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT * FROM ${TABLES.FINANCEIRO}
      WHERE turma_id = $1
      ORDER BY data DESC
    `;
    const result = await query(sql, [id]);
    
    // Calcular totais
    const entradas = result.rows
      .filter(r => r.tipo === 'Entrada')
      .reduce((acc, r) => acc + parseFloat(r.valor_total || 0), 0);
    
    const saidas = result.rows
      .filter(r => r.tipo === 'Saída')
      .reduce((acc, r) => acc + parseFloat(r.valor_total || 0), 0);

    res.json({
      registros: result.rows,
      resumo: {
        entradas,
        saidas,
        saldo: entradas - saidas
      }
    });
  } catch (error) {
    console.error('Error fetching turma financeiro:', error);
    res.status(500).json({ error: 'Erro ao buscar financeiro da turma' });
  }
};
