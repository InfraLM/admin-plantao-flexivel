// Database table names - match exactly with PostgreSQL tables
export const DB_TABLES = {
  ALUNOS: 'lovable.pf_alunos',
  PLANTOES: 'lovable.pf_plantoes',
  TENTATIVAS: 'lovable.pf_tentativas',
  AFTER: 'lovable.pf_after',
} as const;

// Column mappings for each table
// These match the exact column names in PostgreSQL

export const ALUNO_COLUMNS = {
  matricula: 'matricula',
  nome: 'nome',
  telefone: 'telefone',
  email: 'email',
  qtd_plantoes: 'qtd_plantoes',
  data_ultimo_plantao: 'data_ultimo_plantao',
  parcelas_pagas: 'parcelas_pagas',
  parcelas_atraso: 'parcelas_atraso',
  parcelas_aberto: 'parcelas_aberto',
  aulas_total_porcentagem: 'aulas_total_porcentagem',
  id: 'id',
  turma: 'turma',
  criado_em: 'criado_em',
  dias_desde_primeira_aula: 'dias_desde_primeira_aula',
  dias_desde_ultima_aula: 'dias_desde_ultima_aula',
  aulas_assistidas: 'aulas_assistidas',
  status_financeiro: 'status_financeiro',
  qtd_tentativas: 'qtd_tentativas',
} as const;

export const PLANTAO_COLUMNS = {
  data_plantao: 'data_plantao',
  data_marcado: 'data_marcado',
  matricula: 'matricula',
  nome: 'nome',
  telefone: 'telefone',
  status: 'status',
} as const;

// Type aliases for database table rows
export type PfAlunos = {
  matricula: string;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  qtd_plantoes: number | null;
  data_ultimo_plantao: string | null;
  parcelas_pagas: number | null;
  parcelas_atraso: number | null;
  parcelas_aberto: number | null;
  aulas_total_porcentagem: number | null;
  id: number | null;
  turma: string | null;
  criado_em: string | null;
  dias_desde_primeira_aula: number | null;
  dias_desde_ultima_aula: number | null;
  aulas_assistidas: number | null;
  status_financeiro: string | null;
  qtd_tentativas: number | null;
  cidade_estado: string | null;
  cidade: string | null;
  tag: string | null;
};

export type PfPlantoes = {
  data_plantao: string | null;
  data_marcado: string | null;
  matricula: string;
  nome: string | null;
  telefone: string | null;
  status: string | null;
};

export const TENTATIVA_COLUMNS = {
  matricula: 'matricula',
  nome: 'nome',
  telefone: 'telefone',
  data_tentativa: 'data_tentativa',
  data_possivel_plantao: 'data_possivel_plantao',
} as const;

export type PfTentativas = {
  matricula: string;
  nome: string | null;
  telefone: string | null;
  data_tentativa: string | null;
  data_possivel_plantao: string | null;
};

export type PfAfter = {
  matricula: string;
  nome: string | null;
  telefone: string | null;
  data_plantao: string | null;
  uti: string | null;
  cvc: boolean | null;
  pai: boolean | null;
  cardioversao: boolean | null;
  iot: boolean | null;
  dreno: boolean | null;
  sne_svd: boolean | null;
  protocolos_avc: boolean | null;
  paracentese: boolean | null;
  prona: boolean | null;
  marca_passo: boolean | null;
  extubacao: boolean | null;
  decanulacao: boolean | null;
  retirada_dreno: boolean | null;
  toracocentese: boolean | null;
  traqueostomia: boolean | null;
  puncao_liquorica: boolean | null;
  cateter_hemodialise: boolean | null;
  protocolo_me: boolean | null;
  comparecimento: boolean | null;
};

export const AFTER_COLUMNS = {
  matricula: 'matricula',
  nome: 'nome',
  telefone: 'telefone',
  data_plantao: 'data_plantao',
  uti: 'uti',
  cvc: 'cvc',
  pai: 'pai',
  cardioversao: 'cardioversao',
  iot: 'iot',
  dreno: 'dreno',
  sne_svd: 'sne_svd',
  protocolos_avc: 'protocolos_avc',
  paracentese: 'paracentese',
  prona: 'prona',
  marca_passo: 'marca_passo',
  extubacao: 'extubacao',
  decanulacao: 'decanulacao',
  retirada_dreno: 'retirada_dreno',
  toracocentese: 'toracocentese',
  traqueostomia: 'traqueostomia',
  puncao_liquorica: 'puncao_liquorica',
  cateter_hemodialise: 'cateter_hemodialise',
  protocolo_me: 'protocolo_me',
} as const;

export type PfFeedback = {
  id: string;
  data: string | null;
  hora: string | null;
  setor: string | null;
  recepcao_nota: number | null;
  estacionamento_nota: number | null;
  rotina_nota: number | null;
  gutemberque_nota: number | null;
  gutemberque_ponto: string | null;
  candido_nota: number | null;
  candido_ponto: string | null;
  joaopaulo_nota: number | null;
  joaopaulo_ponto: string | null;
  anabeatriz_nota: number | null;
  anabeatriz_ponto: string | null;
  leia_nota: number | null;
  leia_ponto: string | null;
  caiobarros_nota: number | null;
  caiobarros_ponto: string | null;
  ianny_nota: number | null;
  ianny_ponto: string | null;
  brenner_nota: number | null;
  brenner_ponto: string | null;
  ian_nota: number | null;
  ian_ponto: string | null;
  cleto_nota: number | null;
  cleto_ponto: string | null;
  humberto_nota: number | null;
  humberto_ponto: string | null;
  lucas_nota: number | null;
  lucas_ponto: string | null;
  joaopedro_nota: number | null;
  joaopedro_ponto: string | null;
  arthur_nota: number | null;
  arthur_ponto: string | null;
  walter_nota: number | null;
  walter_ponto: string | null;
  fernando_nota: number | null;
  fernando_ponto: string | null;
  aprendeu_algo_novo: boolean | null;
  aprendeu_true_itens: string[] | null;
  desenvolvimento_tecnico: number | null;
  raciocinio_clinico: number | null;
  tempo_disponivel: number | null;
  tempo_ocioso_porcentagem: number | null;
  estrutura_local: number | null;
  relacao_time: number | null;
  avaliacao_geral: number | null;
  objetivo_atingido: number | null;
  comentario_final: string | null;
};

export const FEEDBACK_COLUMNS = {
  id: 'id',
  data: 'data',
  hora: 'hora',
  setor: 'setor',
  recepcao_nota: 'recepcao_nota',
  estacionamento_nota: 'estacionamento_nota',
  rotina_nota: 'rotina_nota',
  gutemberque_nota: 'gutemberque_nota',
  gutemberque_ponto: 'gutemberque_ponto',
  candido_nota: 'candido_nota',
  candido_ponto: 'candido_ponto',
  joaopaulo_nota: 'joaopaulo_nota',
  joaopaulo_ponto: 'joaopaulo_ponto',
  anabeatriz_nota: 'anabeatriz_nota',
  anabeatriz_ponto: 'anabeatriz_ponto',
  leia_nota: 'leia_nota',
  leia_ponto: 'leia_ponto',
  caiobarros_nota: 'caiobarros_nota',
  caiobarros_ponto: 'caiobarros_ponto',
  ianny_nota: 'ianny_nota',
  ianny_ponto: 'ianny_ponto',
  brenner_nota: 'brenner_nota',
  brenner_ponto: 'brenner_ponto',
  ian_nota: 'ian_nota',
  ian_ponto: 'ian_ponto',
  cleto_nota: 'cleto_nota',
  cleto_ponto: 'cleto_ponto',
  humberto_nota: 'humberto_nota',
  humberto_ponto: 'humberto_ponto',
  lucas_nota: 'lucas_nota',
  lucas_ponto: 'lucas_ponto',
  joaopedro_nota: 'joaopedro_nota',
  joaopedro_ponto: 'joaopedro_ponto',
  arthur_nota: 'arthur_nota',
  arthur_ponto: 'arthur_ponto',
  walter_nota: 'walter_nota',
  walter_ponto: 'walter_ponto',
  fernando_nota: 'fernando_nota',
  fernando_ponto: 'fernando_ponto',
  aprendeu_algo_novo: 'aprendeu_algo_novo',
  aprendeu_true_itens: 'aprendeu_true_itens',
  desenvolvimento_tecnico: 'desenvolvimento_tecnico',
  raciocinio_clinico: 'raciocinio_clinico',
  tempo_disponivel: 'tempo_disponivel',
  tempo_ocioso_porcentagem: 'tempo_ocioso_porcentagem',
  estrutura_local: 'estrutura_local',
  relacao_time: 'relacao_time',
  avaliacao_geral: 'avaliacao_geral',
  objetivo_atingido: 'objetivo_atingido',
  comentario_final: 'comentario_final',
} as const;
