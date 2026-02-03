import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, User, Calendar, TrendingUp, AlertCircle, CheckCircle2, XCircle, ChevronLeft, ChevronRight, MapPin, Heart, Check, Plus } from 'lucide-react';
import { useAlunos, useTentativas, usePlantoes, useAfter, useUpdateAlunoField, useCreateAluno } from '@/hooks/useApi';
import { PfAlunos } from '@/lib/database';

const ITEMS_PER_PAGE = 20;

export default function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAluno, setSelectedAluno] = useState<PfAlunos | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name-asc');

  // API hooks
  const { data: alunos = [], isLoading, isError, refetch } = useAlunos();
  const createAluno = useCreateAluno();

  // Manual Registration State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    matricula: '',
    tipoMatricula: 'SEI',
    nome: '',
    telefone: '',
    email: '',
    turma: '',
    cidade: ''
  });

  const handleRegisterChange = (field: string, value: string) => {
    setNewStudent(prev => ({ ...prev, [field]: value }));
  };

  const handleRegisterSubmit = async () => {
    if (!newStudent.matricula || !newStudent.nome) {
      // Basic validation
      return;
    }

    // Default values as requested
    const finalData = {
      matricula: newStudent.matricula,
      nome: newStudent.nome,
      telefone: newStudent.telefone,
      email: newStudent.email,
      turma: newStudent.turma,
      cidade: newStudent.cidade,
      // Default fields
      qtd_plantoes: 0,
      parcelas_pagas: 0,
      parcelas_atraso: 0,
      parcelas_aberto: 0,
      aulas_total_porcentagem: 0,
      aulas_assistidas: 0,
      dias_desde_primeira_aula: 0,
      dias_desde_ultima_aula: 0,
      tag: 'MANUAL', // Explicitly requested
      criado_em: new Date().toLocaleDateString('pt-BR'), // dd/mm/aaaa
      status_financeiro: 'INDEFINIDO', // Default fallback
      id: null // Explicitly empty as requested
    };
    
    // Note: 'tipoMatricula' is collected but not stored strictly as a column per DDL, 
    // effectively used for decision making only if needed, or discarded as per current schema limiting.
    
    try {
      await createAluno.mutateAsync(finalData);
      setIsRegisterOpen(false);
      setNewStudent({
        matricula: '',
        tipoMatricula: 'SEI',
        nome: '',
        telefone: '',
        email: '',
        turma: '',
        cidade: ''
      });
      refetch();
    } catch (error) {
      console.error("Failed to register student", error);
    }
  };

  // Filter and sort alunos
  const filteredAndSortedAlunos = useMemo(() => {
    let result = alunos.filter(
      (aluno: PfAlunos) =>
        (aluno.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (aluno.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (aluno.matricula || '').includes(searchTerm)
    );

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((aluno: PfAlunos) => {
        const status = (aluno.status_financeiro || 'INDEFINIDO').toUpperCase();
        return status === statusFilter;
      });
    }

    // Apply sorting
    result.sort((a: PfAlunos, b: PfAlunos) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.nome || '').localeCompare(b.nome || '');
        case 'name-desc':
          return (b.nome || '').localeCompare(a.nome || '');
        case 'plantoes-asc':
          return (a.qtd_plantoes || 0) - (b.qtd_plantoes || 0);
        case 'plantoes-desc':
          return (b.qtd_plantoes || 0) - (a.qtd_plantoes || 0);
        case 'tentativas-asc':
          return (a.qtd_tentativas || 0) - (b.qtd_tentativas || 0);
        case 'tentativas-desc':
          return (b.qtd_tentativas || 0) - (a.qtd_tentativas || 0);
        case 'aulas-asc':
          return (a.aulas_total_porcentagem || 0) - (b.aulas_total_porcentagem || 0);
        case 'aulas-desc':
          return (b.aulas_total_porcentagem || 0) - (a.aulas_total_porcentagem || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [alunos, searchTerm, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAlunos.length / ITEMS_PER_PAGE);
  const paginatedAlunos = filteredAndSortedAlunos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  const getStatusIcon = (status: string | null) => {
    const normalizedStatus = (status || 'INDEFINIDO').toUpperCase();
    if (normalizedStatus === 'ADIMPLENTE') {
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
    if (normalizedStatus === 'INADIMPLENTE') {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string | null) => {
    const normalizedStatus = (status || 'INDEFINIDO').toUpperCase();
    if (normalizedStatus === 'ADIMPLENTE') {
      return <Badge variant="default" className="bg-success">Adimplente</Badge>;
    }
    if (normalizedStatus === 'INADIMPLENTE') {
      return <Badge variant="destructive">Inadimplente</Badge>;
    }
    return <Badge variant="outline">Indefinido</Badge>;
  };

  if (isLoading) {
    return (
      <>
        <Header title="Checagem de Alunos" description="Verifique a situação dos alunos" />
        <PageLoading text="Carregando alunos..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header title="Checagem de Alunos" description="Verifique a situação dos alunos" />
        <div className="page-container">
          <PageError onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Checagem de Alunos"
        description="Verifique a situação dos alunos e seus plantões"
      />

      <div className="page-container">
        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Add Student Button - Manual Registration */}
          <Button 
            onClick={() => setIsRegisterOpen(true)}
            className="w-full sm:w-auto gap-2"
          >
            <Plus className="h-4 w-4" />
            Registrar Aluno
          </Button>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ADIMPLENTE">Adimplente</SelectItem>
                  <SelectItem value="INADIMPLENTE">Inadimplente</SelectItem>
                  <SelectItem value="INDEFINIDO">Indefinido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ordenar por:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="plantoes-desc">Mais Plantões</SelectItem>
                  <SelectItem value="plantoes-asc">Menos Plantões</SelectItem>
                  <SelectItem value="tentativas-desc">Mais Tentativas</SelectItem>
                  <SelectItem value="tentativas-asc">Menos Tentativas</SelectItem>
                  <SelectItem value="aulas-desc">Maior % Aulas</SelectItem>
                  <SelectItem value="aulas-asc">Menor % Aulas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredAndSortedAlunos.length} aluno{filteredAndSortedAlunos.length !== 1 ? 's' : ''} encontrado{filteredAndSortedAlunos.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedAlunos.map((aluno: PfAlunos) => {
            const tagColorClass = (() => {
              switch (aluno.tag) {
                case 'verde': return 'border-green-500 bg-green-50 dark:bg-green-900/10';
                case 'amarelo': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
                case 'vermelho': return 'border-red-500 bg-red-50 dark:bg-red-900/10';
                default: return '';
              }
            })();

            return (
              <Card
                key={aluno.matricula}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${tagColorClass}`}
                onClick={() => setSelectedAluno(aluno)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {aluno.nome}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Mat: {aluno.matricula}
                      </CardDescription>
                      {(aluno.cidade || aluno.cidade_estado) && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {aluno.cidade || aluno.cidade_estado}
                        </div>
                      )}
                    </div>
                    {getStatusIcon(aluno.status_financeiro)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(aluno.status_financeiro)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Plantões:</span>
                      <span className="font-bold">{aluno.qtd_plantoes || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tentativas:</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">{aluno.qtd_tentativas || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Parc. Pagas:</span>
                      <span className="font-medium text-success">{aluno.parcelas_pagas || 0}</span>
                    </div>
                    {aluno.parcelas_atraso && aluno.parcelas_atraso > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Parc. Atraso:</span>
                        <span className="font-medium text-destructive">{aluno.parcelas_atraso}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {paginatedAlunos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum aluno encontrado</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              {(() => {
                const maxButtons = 5;
                const pages: number[] = [];

                if (totalPages <= maxButtons) {
                  // Show all pages
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Calculate range around current page
                  let start = Math.max(1, currentPage - 2);
                  let end = Math.min(totalPages, currentPage + 2);

                  // Adjust if we're near the start
                  if (currentPage <= 3) {
                    end = maxButtons;
                  }

                  // Adjust if we're near the end
                  if (currentPage >= totalPages - 2) {
                    start = totalPages - maxButtons + 1;
                  }

                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }
                }

                return pages.map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ));
              })()}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={!!selectedAluno} onOpenChange={(open) => !open && setSelectedAluno(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedAluno?.nome}
              </DialogTitle>
            </DialogHeader>
            {selectedAluno && <StudentDetailsContent aluno={selectedAluno} onClose={() => setSelectedAluno(null)} onUpdate={refetch} />}
          </DialogContent>
        </Dialog>
      </div>

        {/* Manual Registration Dialog */}
        <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Registrar Novo Aluno</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="matricula" className="text-right text-sm font-medium">
                  Matrícula
                </label>
                <Input
                  id="matricula"
                  value={newStudent.matricula}
                  onChange={(e) => handleRegisterChange('matricula', e.target.value)}
                  className="col-span-3"
                  placeholder="Ex: 12345"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="tipo" className="text-right text-sm font-medium">
                  Tipo
                </label>
                <Select
                  value={newStudent.tipoMatricula}
                  onValueChange={(value) => handleRegisterChange('tipoMatricula', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEI">SEI</SelectItem>
                    <SelectItem value="Memberkit">Memberkit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="nome" className="text-right text-sm font-medium">
                  Nome
                </label>
                <Input
                  id="nome"
                  value={newStudent.nome}
                  onChange={(e) => handleRegisterChange('nome', e.target.value)}
                  className="col-span-3"
                  placeholder="Nome completo"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="telefone" className="text-right text-sm font-medium">
                  Telefone
                </label>
                <Input
                  id="telefone"
                  value={newStudent.telefone}
                  onChange={(e) => handleRegisterChange('telefone', e.target.value)}
                  className="col-span-3"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="email" className="text-right text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  value={newStudent.email}
                  onChange={(e) => handleRegisterChange('email', e.target.value)}
                  className="col-span-3"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="turma" className="text-right text-sm font-medium">
                  Turma
                </label>
                <Select
                  value={newStudent.turma}
                  onValueChange={(value) => handleRegisterChange('turma', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Turma 1</SelectItem>
                    <SelectItem value="2">Turma 2</SelectItem>
                    <SelectItem value="3">Turma 3</SelectItem>
                    <SelectItem value="4">Turma 4</SelectItem>
                    <SelectItem value="5">Turma 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="cidade" className="text-right text-sm font-medium">
                  Cidade
                </label>
                <Input
                  id="cidade"
                  value={newStudent.cidade}
                  onChange={(e) => handleRegisterChange('cidade', e.target.value)}
                  className="col-span-3"
                  placeholder="Cidade"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
               <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancelar</Button>
               <Button onClick={handleRegisterSubmit} disabled={createAluno.isPending}>
                 {createAluno.isPending ? 'Registrando...' : 'Registrar'}
               </Button>
            </div>
          </DialogContent>
        </Dialog>
    </>
  );
}

// Student Details Component with Tabs
function StudentDetailsContent({ aluno, onClose, onUpdate }: { aluno: PfAlunos, onClose: () => void, onUpdate: () => void }) {
  const { data: tentativas = [] } = useTentativas({ matricula: aluno.matricula });
  const { data: plantoes = [] } = usePlantoes();
  const { data: afterRecords = [] } = useAfter({ matricula: aluno.matricula });

  const studentPlantoes = plantoes.filter(p => p.matricula === aluno.matricula);

  // Calculate last shift date
  const lastShiftDate = studentPlantoes.length > 0
    ? studentPlantoes.reduce((latest, current) => {
      if (!latest.data_plantao) return current;
      if (!current.data_plantao) return latest;

      const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      };

      return parseDate(current.data_plantao) > parseDate(latest.data_plantao) ? current : latest;
    }).data_plantao
    : null;

  const getStatusBadge = (status: string | null) => {
    const normalizedStatus = (status || 'INDEFINIDO').toUpperCase();
    if (normalizedStatus === 'ADIMPLENTE') {
      return <Badge variant="default" className="bg-success">Adimplente</Badge>;
    }
    if (normalizedStatus === 'INADIMPLENTE') {
      return <Badge variant="destructive">Inadimplente</Badge>;
    }
    return <Badge variant="secondary">Indefinido</Badge>;
  };

  const updateFieldMutation = useUpdateAlunoField();
  const [tempTag, setTempTag] = useState(aluno.tag || 'null');

  const handleSaveTag = async () => {
    try {
      await updateFieldMutation.mutateAsync({
        id: aluno.matricula,
        field: 'tag',
        value: tempTag === 'null' ? null : tempTag
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };



  return (
    <Tabs defaultValue="dados" className="mt-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
        <TabsTrigger value="plantoes">Histórico de Plantões</TabsTrigger>
      </TabsList>

      {/* Tab 1: General Data */}
      <TabsContent value="dados" className="space-y-4">
        {/* Location */}
        {/* Location & Tag */}
        <div className="grid grid-cols-2 gap-4">
          {/* Location */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <MapPin className="h-4 w-4 text-primary" />
            <div>
              <span className="text-sm text-muted-foreground">Cidade/Estado:</span>
              <p className="font-medium">{aluno.cidade || aluno.cidade_estado || '-'}</p>
            </div>
          </div>

          {/* Tag Selector */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="w-full">
              <span className="text-sm text-muted-foreground mb-1 block">Classificação (Tag):</span>
              <div className="flex items-center gap-2">
                <Select
                  value={tempTag}
                  onValueChange={setTempTag}
                >
                  <SelectTrigger className="w-full h-8">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Nenhuma</SelectItem>
                    <SelectItem value="verde" className="text-green-600 font-medium">Bom (Verde)</SelectItem>
                    <SelectItem value="amarelo" className="text-yellow-600 font-medium">Mediano (Amarelo)</SelectItem>
                    <SelectItem value="vermelho" className="text-red-600 font-medium">Ruim (Vermelho)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0"
                  onClick={handleSaveTag}
                  title="Salvar Tag"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div>
          <h4 className="font-semibold mb-3">Dados Pessoais</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Matrícula:</span>
              <p className="font-mono">{aluno.matricula}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p>{aluno.email || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Telefone:</span>
              <p>{aluno.telefone || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Turma:</span>
              <p>{aluno.turma || '-'}</p>
            </div>
          </div>
        </div>

        {/* Financial Status */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Situação Financeira
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <div className="mt-1">{getStatusBadge(aluno.status_financeiro)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Parcelas Pagas:</span>
              <p className="font-medium text-success">{aluno.parcelas_pagas || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Parcelas em Atraso:</span>
              <p className="font-medium text-destructive">{aluno.parcelas_atraso || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Parcelas em Aberto:</span>
              <p className="font-medium text-warning">{aluno.parcelas_aberto || 0}</p>
            </div>
          </div>
        </div>

        {/* Class Attendance */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Frequência de Aulas
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Aulas Assistidas:</span>
              <p className="font-medium">{aluno.aulas_assistidas || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground">% Total de Aulas:</span>
              <p className="font-medium">{((aluno.aulas_total_porcentagem || 0) * 100).toFixed(2)}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">Dias desde 1ª Aula:</span>
              <p>{aluno.dias_desde_primeira_aula || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Dias desde Última Aula:</span>
              <p>{aluno.dias_desde_ultima_aula || '-'}</p>
            </div>
          </div>
        </div>

        {aluno.criado_em && (
          <div className="border-t pt-4">
            <div className="text-xs text-muted-foreground">
              Cadastrado em: {aluno.criado_em}
            </div>
          </div>
        )}
      </TabsContent>

      {/* Tab 2: Shift History */}
      <TabsContent value="plantoes" className="space-y-4">
        {/* Summary Stats */}
        <div>
          <h4 className="font-semibold mb-3">Resumo de Plantões</h4>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Total de Plantões:</span>
              <p className="font-bold text-lg text-primary">{studentPlantoes.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tentativas:</span>
              <p className="font-bold text-lg text-amber-600 dark:text-amber-400">{tentativas.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Faltas:</span>
              <p className="font-bold text-lg text-destructive">
                {afterRecords.filter(r => r.comparecimento === false).length}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Último Plantão:</span>
              <p className="font-medium">{lastShiftDate || 'Nenhum'}</p>
            </div>
          </div>
        </div>

        {/* Procedimentos Realizados */}
        {(() => {
          const procedureTotals = {
            cvc: afterRecords.filter(r => r.cvc).length,
            pai: afterRecords.filter(r => r.pai).length,
            cardioversao: afterRecords.filter(r => r.cardioversao).length,
            iot: afterRecords.filter(r => r.iot).length,
            dreno: afterRecords.filter(r => r.dreno).length,
            sne_svd: afterRecords.filter(r => r.sne_svd).length,
            protocolos_avc: afterRecords.filter(r => r.protocolos_avc).length,
            paracentese: afterRecords.filter(r => r.paracentese).length,
            prona: afterRecords.filter(r => r.prona).length,
            marca_passo: afterRecords.filter(r => r.marca_passo).length,
            extubacao: afterRecords.filter(r => r.extubacao).length,
            decanulacao: afterRecords.filter(r => r.decanulacao).length,
            retirada_dreno: afterRecords.filter(r => r.retirada_dreno).length,
            toracocentese: afterRecords.filter(r => r.toracocentese).length,
            traqueostomia: afterRecords.filter(r => r.traqueostomia).length,
            puncao_liquorica: afterRecords.filter(r => r.puncao_liquorica).length,
            cateter_hemodialise: afterRecords.filter(r => r.cateter_hemodialise).length,
            protocolo_me: afterRecords.filter(r => r.protocolo_me).length,
          };

          return (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-destructive" />
                Procedimentos Realizados
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">CVC:</span>
                  <p className="font-medium">{procedureTotals.cvc}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">PAI:</span>
                  <p className="font-medium">{procedureTotals.pai}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cardioversão:</span>
                  <p className="font-medium">{procedureTotals.cardioversao}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">IOT:</span>
                  <p className="font-medium">{procedureTotals.iot}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dreno:</span>
                  <p className="font-medium">{procedureTotals.dreno}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">SNE/SVD:</span>
                  <p className="font-medium">{procedureTotals.sne_svd}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Protocolos AVC:</span>
                  <p className="font-medium">{procedureTotals.protocolos_avc}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Paracentese:</span>
                  <p className="font-medium">{procedureTotals.paracentese}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Prona:</span>
                  <p className="font-medium">{procedureTotals.prona}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Marca-passo:</span>
                  <p className="font-medium">{procedureTotals.marca_passo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Extubação:</span>
                  <p className="font-medium">{procedureTotals.extubacao}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Decanulação:</span>
                  <p className="font-medium">{procedureTotals.decanulacao}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Retirada de Dreno:</span>
                  <p className="font-medium">{procedureTotals.retirada_dreno}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Toracocentese:</span>
                  <p className="font-medium">{procedureTotals.toracocentese}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Traqueostomia:</span>
                  <p className="font-medium">{procedureTotals.traqueostomia}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Punção Liquórica:</span>
                  <p className="font-medium">{procedureTotals.puncao_liquorica}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cateter Hemodiálise:</span>
                  <p className="font-medium">{procedureTotals.cateter_hemodialise}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Protocolo ME:</span>
                  <p className="font-medium">{procedureTotals.protocolo_me}</p>
                </div>
              </div>
            </div>
          );
        })()}
      </TabsContent>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </Tabs>
  );
}
