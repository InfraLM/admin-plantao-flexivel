import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAlunos } from '@/hooks/useApi';
import { OnboardingStatus } from '@/types/clinic';
import { Hand, Package, Users, CheckCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const etapas: { value: OnboardingStatus; label: string; icon: React.ElementType; progresso: number }[] = [
  { value: 'Boas-vindas', label: 'Boas-vindas', icon: Hand, progresso: 25 },
  { value: 'Envio do Livro', label: 'Envio do Livro', icon: Package, progresso: 50 },
  { value: 'Grupo da Turma', label: 'Grupo da Turma', icon: Users, progresso: 75 },
  { value: 'Concluído', label: 'Concluído', icon: CheckCircle, progresso: 100 },
];

interface OnboardingItem {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_matricula: string;
  etapa: OnboardingStatus;
  progresso: number;
}

export default function Onboarding() {
  const { data: alunos = [], isLoading, isError, refetch } = useAlunos({ status: 'Em Onboarding' });

  const initialOnboarding: OnboardingItem[] = useMemo(() => 
    alunos.map((aluno) => ({
      id: aluno.id,
      nome: aluno.nome,
      email: aluno.email,
      telefone: aluno.telefone,
      data_matricula: aluno.data_matricula,
      etapa: 'Boas-vindas' as OnboardingStatus,
      progresso: 25,
    })),
    [alunos]
  );

  const [items, setItems] = useState<OnboardingItem[]>([]);
  
  // Sync items with alunos when data changes
  const displayItems = useMemo(() => {
    if (items.length > 0) return items;
    return initialOnboarding;
  }, [items, initialOnboarding]);

  const handleUpdateEtapa = (id: string, etapa: OnboardingStatus) => {
    const etapaInfo = etapas.find((e) => e.value === etapa);
    setItems((prev) => {
      const base = prev.length > 0 ? prev : initialOnboarding;
      return base.map((item) =>
        item.id === id
          ? { ...item, etapa, progresso: etapaInfo?.progresso || 0 }
          : item
      );
    });
    toast.success(`Etapa atualizada para: ${etapa}`);
  };

  const handleAdvanceEtapa = (id: string) => {
    const item = displayItems.find((i) => i.id === id);
    if (!item) return;

    const currentIndex = etapas.findIndex((e) => e.value === item.etapa);
    if (currentIndex < etapas.length - 1) {
      const nextEtapa = etapas[currentIndex + 1];
      handleUpdateEtapa(id, nextEtapa.value);
    }
  };

  const getEtapaInfo = (etapa: OnboardingStatus) => {
    return etapas.find((e) => e.value === etapa);
  };

  // Summary counts
  const countByEtapa = etapas.map((etapa) => ({
    ...etapa,
    count: displayItems.filter((item) => item.etapa === etapa.value).length,
  }));

  if (isLoading) {
    return (
      <>
        <Header title="Onboarding" description="Acompanhe o processo de integração dos novos alunos" />
        <PageLoading text="Carregando onboarding..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header title="Onboarding" description="Acompanhe o processo de integração dos novos alunos" />
        <div className="page-container">
          <PageError onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Onboarding"
        description="Acompanhe o processo de integração dos novos alunos"
      />

      <div className="page-container">
        {/* Pipeline Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          {countByEtapa.map((etapa) => {
            const Icon = etapa.icon;
            return (
              <div
                key={etapa.value}
                className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{etapa.label}</p>
                    <p className="text-3xl font-bold text-foreground">{etapa.count}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    etapa.value === 'Concluído' ? 'bg-success/10' : 'bg-primary/10'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      etapa.value === 'Concluído' ? 'text-success' : 'text-primary'
                    }`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pipeline Flow Visual */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Fluxo de Onboarding</h3>
          <div className="flex items-center justify-between">
            {etapas.map((etapa, index) => {
              const Icon = etapa.icon;
              const count = displayItems.filter((item) => item.etapa === etapa.value).length;
              return (
                <div key={etapa.value} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
                      etapa.value === 'Concluído' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{etapa.label}</p>
                    <p className="text-xs text-muted-foreground">{count} aluno(s)</p>
                  </div>
                  {index < etapas.length - 1 && (
                    <ChevronRight className="mx-4 h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Onboarding Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Alunos em Onboarding</h3>
          
          {displayItems.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-success/50" />
              <p className="mt-4 text-lg font-medium text-foreground">
                Nenhum aluno em onboarding
              </p>
              <p className="text-sm text-muted-foreground">
                Todos os alunos já foram integrados
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {displayItems.map((item) => {
                const etapaInfo = getEtapaInfo(item.etapa);
                const Icon = etapaInfo?.icon || Hand;
                const isCompleted = item.etapa === 'Concluído';

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border bg-card p-5 transition-all hover:shadow-md ${
                      isCompleted ? 'border-success/30' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            isCompleted ? 'bg-success/10' : 'bg-primary/10'
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              isCompleted ? 'text-success' : 'text-primary'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{item.nome}</h4>
                            <p className="text-sm text-muted-foreground">{item.email}</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{item.progresso}%</span>
                          </div>
                          <Progress value={item.progresso} className="h-2" />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Etapa:</span>
                              <Select
                                value={item.etapa}
                                onValueChange={(value) => handleUpdateEtapa(item.id, value as OnboardingStatus)}
                              >
                                <SelectTrigger className="h-8 w-[160px]">
                                  <StatusBadge status={item.etapa} />
                                </SelectTrigger>
                                <SelectContent>
                                  {etapas.map((e) => (
                                    <SelectItem key={e.value} value={e.value}>
                                      {e.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {!isCompleted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAdvanceEtapa(item.id)}
                              >
                                Avançar
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                            <span>Tel: {item.telefone}</span>
                            <span>Matrícula: {item.data_matricula}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
