// Types based on the PostgreSQL tables (all VARCHAR in DB)
// 
// TABLE MAPPING:
// - Aluno        → ci_alunos_pacientes
// - Turma        → ci_turmas_tratamentos
// - AlunoTurma   → ci_aluno_turma
// - Financeiro   → ci_financeiro

/**
 * Represents a student/patient record
 * PostgreSQL table: ci_alunos_pacientes
 */
export interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string; // dd/mm/yyyy format
  cpf: string;
  endereco: string;
  status: 'Ativo' | 'Inativo' | 'Em Onboarding';
  data_matricula: string; // dd/mm/yyyy format
  observacoes: string;
  // New fields
  vendedor: string;
  valor_venda: string; // VARCHAR but treated as currency
  parcelas: string; // '0' to '12'
  pos_graduacao: boolean;
}

/**
 * Represents a class/treatment group
 * PostgreSQL table: ci_turmas_tratamentos
 */
export interface Turma {
  id: string;
  nome: string;
  descricao: string;
  data_inicio: string; // dd/mm/yyyy format
  data_fim: string; // dd/mm/yyyy format
  horario: string;
  local: string;
  capacidade: string; // VARCHAR but treated as number
  instrutor: string;
  status: 'Aberta' | 'Em Andamento' | 'Finalizada' | 'Cancelada';
  valor: string; // VARCHAR but treated as currency
}

/**
 * Represents the relationship between a student and a class
 * PostgreSQL table: ci_aluno_turma
 */
export interface AlunoTurma {
  id: string;
  aluno_id: string;
  turma_id: string;
  data_inscricao: string;
  status: 'Inscrito' | 'Concluído' | 'Desistente';
}

/**
 * Represents a financial record (income or expense)
 * PostgreSQL table: ci_financeiro
 */
export interface Financeiro {
  id: string;
  categoria: string;
  descricao: string;
  quantidade: string; // VARCHAR but treated as number
  valor_unitario: string; // VARCHAR but treated as currency
  valor_total: string; // VARCHAR but treated as currency (calculated)
  tipo: 'Entrada' | 'Saída';
  data: string; // dd/mm/yyyy format
  turma_id?: string;
  observacoes: string;
}

export type OnboardingStatus = 'Boas-vindas' | 'Envio do Livro' | 'Grupo da Turma' | 'Concluído';

export interface OnboardingItem {
  aluno: Aluno;
  etapa: OnboardingStatus;
  progresso: number;
}

export const VENDEDORES = [
  'MARCELO',
  'MATHEUS',
  'VICTORIA',
  'RANY',
  'ANA KAROLYNA',
  'MURILO',
  'GUSTAVO',
  'ANA BEATRIZ',
  'LEIA',
  'MAISA',
  'RICARDO',
  'WEBER',
  'IAN',
] as const;

export const PARCELAS_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
