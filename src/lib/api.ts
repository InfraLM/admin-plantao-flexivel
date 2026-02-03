// API Configuration
// Base path: /admin-plantao-flexivel/api
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : 'https://lmedu.com.br/admin-plantao-flexivel/api';

// ============================================================================
// DEBUG LOGGING - CONFIGURAÇÃO INICIAL
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('🚀 [API] MÓDULO API CARREGADO');
console.log('='.repeat(70));
console.log('📅 Data/Hora:', new Date().toLocaleString('pt-BR'));
console.log('🌍 Environment:', import.meta.env.MODE || 'production');
console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL || '(não definido - usando produção)');
console.log('🎯 API_BASE_URL:', API_BASE_URL);
console.log('🌐 Window Location:', window.location.href);
console.log('='.repeat(70) + '\n');

// Contador de requisições
let requestCount = 0;
let successCount = 0;
let errorCount = 0;

// Generic fetch wrapper with error handling and detailed logging
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  requestCount++;
  const requestId = requestCount;
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';

  console.log('\n' + '-'.repeat(70));
  console.log(`📡 [API Request #${requestId}] ${method} ${endpoint}`);
  console.log(`🔗 URL Completa: ${url}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  if (options.body) {
    try {
      const bodyPreview = JSON.parse(options.body as string);
      // Ocultar senha nos logs
      if (bodyPreview.password) bodyPreview.password = '******';
      console.log('📦 Body:', JSON.stringify(bodyPreview, null, 2));
    } catch {
      console.log('📦 Body: [binary data]');
    }
  }

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const startTime = performance.now();

  try {
    console.log('⏳ Enviando requisição...');

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    console.log(`📨 [API Response #${requestId}]`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Tempo: ${duration}ms`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Unknown error',
        status: response.status,
        statusText: response.statusText
      }));

      errorCount++;

      console.error(`❌ [API Error #${requestId}]`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Erro:`, error);
      console.error(`   URL: ${url}`);
      console.error(`   Stats: ${successCount} sucessos, ${errorCount} erros de ${requestCount} total`);
      console.log('-'.repeat(70) + '\n');

      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    successCount++;

    console.log(`✅ [API Success #${requestId}]`);
    console.log(`   Dados recebidos:`, data);
    console.log(`   Tempo total: ${duration}ms`);
    console.log(`   Stats: ${successCount} sucessos, ${errorCount} erros de ${requestCount} total`);
    console.log('-'.repeat(70) + '\n');

    return data;

  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    errorCount++;

    console.error('\n' + '!'.repeat(70));
    console.error(`❌ [API Connection Error #${requestId}]`);
    console.error(`   URL: ${url}`);
    console.error(`   Method: ${method}`);
    console.error(`   Tempo até erro: ${duration}ms`);
    console.error(`   Erro:`, error);
    console.error(`   Tipo:`, error instanceof Error ? error.name : typeof error);
    console.error(`   Mensagem:`, error instanceof Error ? error.message : String(error));

    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('\n   🔴 ERRO DE REDE - Possíveis causas:');
      console.error('   1. Backend não está rodando');
      console.error('   2. CORS bloqueando requisição');
      console.error('   3. URL incorreta');
      console.error('   4. Firewall bloqueando');
      console.error('   5. Sem conexão com internet');
      console.error('\n   💡 AÇÕES:');
      console.error('   1. Verifique se backend está online:');
      console.error(`      ${API_BASE_URL}/health`);
      console.error('   2. Abra Network tab no DevTools');
      console.error('   3. Veja logs do servidor no cPanel');
    }

    console.error(`   Stats: ${successCount} sucessos, ${errorCount} erros de ${requestCount} total`);
    console.error('!'.repeat(70) + '\n');

    throw error;
  }
}

// ============================================================================
// ALUNOS API
// ============================================================================
export const alunosAPI = {
  getAll: (params?: { search?: string }) => {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== '')
    ).toString();
    console.log('👥 [alunosAPI.getAll] Params:', params);
    return fetchAPI<any[]>(`/alunos${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) => {
    console.log('👤 [alunosAPI.getById] ID:', id);
    return fetchAPI<any>(`/alunos/${id}`);
  },

  create: (data: any) => {
    console.log('➕ [alunosAPI.create] Criando aluno:', data.nome);
    return fetchAPI<any>('/alunos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: string, data: any) => {
    console.log('✏️ [alunosAPI.update] Atualizando aluno ID:', id);
    return fetchAPI<any>(`/alunos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateField: (id: string, field: string, value: any) => {
    console.log(`🔧 [alunosAPI.updateField] ID: ${id}, Campo: ${field}, Valor:`, value);
    return fetchAPI<any>(`/alunos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ field, value }),
    });
  },

  delete: (id: string) => {
    console.log('🗑️ [alunosAPI.delete] Deletando aluno ID:', id);
    return fetchAPI<any>(`/alunos/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// PLANTOES API
// ============================================================================
export const plantoesAPI = {
  getAll: (params?: { status?: string; matricula?: string; data_plantao?: string }) => {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== '')
    ).toString();
    console.log('📅 [plantoesAPI.getAll] Params:', params);
    return fetchAPI<any[]>(`/plantoes${queryString ? `?${queryString}` : ''}`);
  },

  create: (data: { matricula: string; data_plantao: string; status?: string }) => {
    console.log('➕ [plantoesAPI.create] Criando plantão:', data);
    return fetchAPI<any>('/plantoes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus: (matricula: string, data_plantao: string, status: string) => {
    console.log('✏️ [plantoesAPI.updateStatus] Atualizando status:', status);
    // Encode data_plantao because it contains slashes
    const encodedData = encodeURIComponent(data_plantao);
    return fetchAPI<any>(`/plantoes/${matricula}/${encodedData}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  delete: (matricula: string, data_plantao: string) => {
    console.log('🗑️ [plantoesAPI.delete] Deletando plantão:', matricula, data_plantao);
    return fetchAPI<any>(`/plantoes/${encodeURIComponent(matricula)}/${encodeURIComponent(data_plantao)}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// TENTATIVAS API
// ============================================================================
export const tentativasAPI = {
  getAll: (params?: { matricula?: string }) => {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== '')
    ).toString();
    console.log('🔄 [tentativasAPI.getAll] Params:', params);
    return fetchAPI<any[]>(`/tentativas${queryString ? `?${queryString}` : ''}`);
  },

  getCount: (matricula: string) => {
    console.log('📊 [tentativasAPI.getCount] Matricula:', matricula);
    return fetchAPI<{ count: number }>(`/tentativas/count/${matricula}`);
  },

  create: (data: { matricula: string; data_possivel_plantao: string; data_que_conseguiu?: string }) => {
    console.log('➕ [tentativasAPI.create] Criando tentativa:', data);
    return fetchAPI<any>('/tentativas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: (matricula: string, data_tentativa: string, data_possivel_plantao: string) => {
    console.log('🗑️ [tentativasAPI.delete] Deletando tentativa:', matricula, data_tentativa, data_possivel_plantao);
    return fetchAPI<any>(
      `/tentativas/${encodeURIComponent(matricula)}/${encodeURIComponent(data_tentativa)}/${encodeURIComponent(data_possivel_plantao)}`,
      { method: 'DELETE' }
    );
  },
};

// ============================================================================
// FEEDBACK API
// ============================================================================
export const feedbackAPI = {
  getAll: () => {
    console.log('🗣️ [feedbackAPI.getAll]');
    return fetchAPI<any[]>('/feedback');
  },
};

// ============================================================================
// AFTER API
// ============================================================================
export const afterAPI = {
  getAll: (params?: { matricula?: string }) => {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== '')
    ).toString();
    console.log('📋 [afterAPI.getAll] Params:', params);
    return fetchAPI<any[]>(`/after${queryString ? `?${queryString}` : ''}`);
  },

  getById: (matricula: string, data_plantao: string) => {
    console.log('📋 [afterAPI.getById] Matricula:', matricula, 'Data:', data_plantao);
    return fetchAPI<any>(`/after/${encodeURIComponent(matricula)}/${encodeURIComponent(data_plantao)}`);
  },

  create: (data: any) => {
    console.log('➕ [afterAPI.create] Criando registro after:', data);
    return fetchAPI<any>('/after', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (matricula: string, data_plantao: string, data: any) => {
    console.log('✏️ [afterAPI.update] Atualizando after:', matricula, data_plantao);
    return fetchAPI<any>(`/after/${encodeURIComponent(matricula)}/${encodeURIComponent(data_plantao)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: (matricula: string, data_plantao: string) => {
    console.log('🗑️ [afterAPI.delete] Deletando after:', matricula, data_plantao);
    return fetchAPI<any>(`/after/${encodeURIComponent(matricula)}/${encodeURIComponent(data_plantao)}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// AUTH API
// ============================================================================
export const authAPI = {
  login: (username: string, password: string) => {
    console.log('🔐 [authAPI.login] Tentando login para:', username);
    return fetchAPI<{ success: boolean; user: { username: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
};

// ============================================================================
// HEALTH CHECK & DIAGNOSTICS
// ============================================================================

export const healthCheck = async () => {
  console.log('\n🏥 [Health Check] Iniciando verificação de saúde do backend...');
  try {
    const result = await fetchAPI<{
      status: string;
      timestamp: string;
      database?: {
        connected: boolean;
        error?: string;
      };
    }>('/health');

    console.log('✅ [Health Check] Backend está online!');

    if (result.database) {
      if (result.database.connected) {
        console.log('✅ [Health Check] Database PostgreSQL: CONECTADO');
      } else {
        console.error('❌ [Health Check] Database PostgreSQL: DESCONECTADO');
        console.error('   Erro:', result.database.error);
      }
    }

    return result;
  } catch (error) {
    console.error('❌ [Health Check] Backend não disponível');
    console.error('   Erro:', error);
    throw error;
  }
};

export const testConnection = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🔌 [Test Connection] TESTE DE CONEXÃO COMPLETO');
  console.log('='.repeat(70));
  console.log('📅 Data/Hora:', new Date().toLocaleString('pt-BR'));
  console.log('🎯 API URL:', API_BASE_URL);
  console.log('🌐 Location:', window.location.href);
  console.log('');

  try {
    const health = await healthCheck();

    console.log('\n✅ RESULTADO: SUCESSO');
    console.log('   Status:', health.status);
    console.log('   Timestamp:', health.timestamp);

    if (health.database) {
      console.log('   Database Connected:', health.database.connected ? '✅ SIM' : '❌ NÃO');
      if (health.database.error) {
        console.log('   Database Error:', health.database.error);
      }
    }

    console.log('\n📊 Estatísticas:');
    console.log(`   Total de requisições: ${requestCount}`);
    console.log(`   Sucessos: ${successCount}`);
    console.log(`   Erros: ${errorCount}`);
    console.log(`   Taxa de sucesso: ${requestCount > 0 ? Math.round((successCount / requestCount) * 100) : 0}%`);

    console.log('='.repeat(70) + '\n');

    return { status: 'connected', ...health };
  } catch (error) {
    console.error('\n❌ RESULTADO: FALHA');
    console.error('   Erro:', error);
    console.error('\n💡 Sugestões:');
    console.error('   1. Verifique se o backend está rodando');
    console.error('   2. Abra Network tab e veja os erros');
    console.error('   3. Verifique CORS no backend');
    console.error('   4. Verifique logs do servidor');
    console.error('='.repeat(70) + '\n');
    throw error;
  }
};

export const testDatabase = async () => {
  console.log('\n🔬 [Test Database] TESTE DETALHADO DO BANCO DE DADOS');
  try {
    const result = await fetchAPI<any>('/db-test');

    console.log('✅ [Test Database] Resultado:', result);
    console.log('');

    if (result.results) {
      result.results.forEach((test: any, index: number) => {
        const icon = test.status === 'success' ? '✅' : test.status === 'error' ? '❌' : '⚠️';
        console.log(`${icon} Teste ${index + 1}: ${test.test} - ${test.status.toUpperCase()}`);
        if (test.tables) {
          console.log('   Tabelas:', test.tables.join(', '));
        }
        if (test.error) {
          console.error('   Erro:', test.error);
        }
      });
    }

    return result;
  } catch (error) {
    console.error('❌ [Test Database] Erro:', error);
    throw error;
  }
};

// ============================================================================
// STATS & MONITORING
// ============================================================================

export const getApiStats = () => {
  const stats = {
    totalRequests: requestCount,
    successCount: successCount,
    errorCount: errorCount,
    successRate: requestCount > 0 ? Math.round((successCount / requestCount) * 100) : 0,
    errorRate: requestCount > 0 ? Math.round((errorCount / requestCount) * 100) : 0,
  };

  console.log('\n📊 [API Stats]');
  console.log('   Total:', stats.totalRequests);
  console.log('   Sucessos:', stats.successCount);
  console.log('   Erros:', stats.errorCount);
  console.log('   Taxa de sucesso:', stats.successRate + '%');
  console.log('   Taxa de erro:', stats.errorRate + '%');
  console.log('');

  return stats;
};

// Auto-test on load (após 2 segundos)
setTimeout(() => {
  console.log('\n🔄 [Auto-Test] Executando teste automático de conexão...');
  testConnection().catch(() => {
    console.warn('⚠️ [Auto-Test] Falha no teste automático - verifique manualmente');
  });
}, 2000);

// Export config
export const apiConfig = {
  baseUrl: API_BASE_URL,
};

// Log final
console.log('💡 [API] Comandos disponíveis no console:');
console.log('   - testConnection()  : Testa conexão com backend');
console.log('   - testDatabase()    : Testa conexão com PostgreSQL');
console.log('   - healthCheck()     : Verifica saúde do sistema');
console.log('   - getApiStats()     : Mostra estatísticas de requisições');
console.log('');