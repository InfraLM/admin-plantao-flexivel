import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alunosAPI, plantoesAPI, tentativasAPI, afterAPI, feedbackAPI } from '@/lib/api';
import { toast } from 'sonner';

// Debug logging
console.log('🪝 [useApi] Hooks carregados');
console.log('🪝 [useApi] Todas as requisições vão para o backend PostgreSQL');

// ============ ALUNOS HOOKS ============
export function useAlunos(params?: { search?: string }) {
  return useQuery({
    queryKey: ['alunos', params],
    queryFn: () => alunosAPI.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  });
}

export function useAluno(id: string) {
  return useQuery({
    queryKey: ['alunos', id],
    queryFn: () => alunosAPI.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateAluno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => alunosAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast.success('Aluno cadastrado com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useCreateAluno] Erro:', error);
      toast.error(`Erro ao cadastrar aluno: ${error.message}`);
    },
  });
}

export function useUpdateAluno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => alunosAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast.success('Aluno atualizado com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useUpdateAluno] Erro:', error);
      toast.error(`Erro ao atualizar aluno: ${error.message}`);
    },
  });
}

export function useUpdateAlunoField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, field, value }: { id: string; field: string; value: any }) =>
      alunosAPI.updateField(id, field, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast.success('Campo atualizado com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useUpdateAlunoField] Erro:', error);
      toast.error(`Erro ao atualizar campo: ${error.message}`);
    },
  });
}

export function useDeleteAluno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alunosAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast.success('Aluno removido com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useDeleteAluno] Erro:', error);
      toast.error(`Erro ao remover aluno: ${error.message}`);
    },
  });
}

// ============ PLANTOES HOOKS ============
export function usePlantoes(params?: { status?: string; matricula?: string; data_plantao?: string }) {
  return useQuery({
    queryKey: ['plantoes', params],
    queryFn: () => plantoesAPI.getAll(params),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useCreatePlantao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { matricula: string; data_plantao: string; status?: string }) => plantoesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantoes'] });
      queryClient.invalidateQueries({ queryKey: ['alunos'] }); // Update student counters
      toast.success('Plantão marcado com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useCreatePlantao] Erro:', error);
      toast.error(`Erro ao marcar plantão: ${error.message}`);
    },
  });
}

export function useUpdatePlantaoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matricula, data_plantao, status }: { matricula: string; data_plantao: string; status: string }) =>
      plantoesAPI.updateStatus(matricula, data_plantao, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantoes'] });
      toast.success('Status do plantão atualizado');
    },
    onError: (error: Error) => {
      console.error('[useUpdatePlantaoStatus] Erro:', error);
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}

export function useDeletePlantao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matricula, data_plantao }: { matricula: string; data_plantao: string }) =>
      plantoesAPI.delete(matricula, data_plantao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantoes'] });
      queryClient.invalidateQueries({ queryKey: ['alunos'] }); // Update student counters
      toast.success('Plantão removido com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useDeletePlantao] Erro:', error);
      toast.error(`Erro ao remover plantão: ${error.message}`);
    },
  });
}

// ============ TENTATIVAS HOOKS ============
export function useTentativas(params?: { matricula?: string }) {
  return useQuery({
    queryKey: ['tentativas', params],
    queryFn: () => tentativasAPI.getAll(params),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useCreateTentativa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { matricula: string; data_possivel_plantao: string; data_que_conseguiu?: string }) => tentativasAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tentativas'] });
      queryClient.invalidateQueries({ queryKey: ['alunos'] }); // Update student counters
      toast.success('Tentativa registrada com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useCreateTentativa] Erro:', error);
      toast.error(`Erro ao registrar tentativa: ${error.message}`);
    },
  });
}

export function useDeleteTentativa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matricula, data_tentativa, data_possivel_plantao }: { matricula: string; data_tentativa: string; data_possivel_plantao: string }) =>
      tentativasAPI.delete(matricula, data_tentativa, data_possivel_plantao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tentativas'] });
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      toast.success('Tentativa removida com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useDeleteTentativa] Erro:', error);
      toast.error(`Erro ao remover tentativa: ${error.message}`);
    },
  });
}

// ============ AFTER HOOKS ============
export function useAfter(params?: { matricula?: string }) {
  return useQuery({
    queryKey: ['after', params],
    queryFn: () => afterAPI.getAll(params),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useCreateAfter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => afterAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['after'] });
      queryClient.invalidateQueries({ queryKey: ['plantoes'] });
      toast.success('Registro criado e plantão marcado como realizado!');
    },
    onError: (error: Error) => {
      console.error('[useCreateAfter] Erro:', error);
      toast.error(`Erro ao criar registro: ${error.message}`);
    },
  });
}

export function useUpdateAfter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matricula, data_plantao, data }: { matricula: string; data_plantao: string; data: any }) =>
      afterAPI.update(matricula, data_plantao, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['after'] });
      toast.success('Registro atualizado com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useUpdateAfter] Erro:', error);
      toast.error(`Erro ao atualizar registro: ${error.message}`);
    },
  });
}

export function useDeleteAfter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matricula, data_plantao }: { matricula: string; data_plantao: string }) =>
      afterAPI.delete(matricula, data_plantao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['after'] });
      queryClient.invalidateQueries({ queryKey: ['plantoes'] });
      toast.success('Registro removido com sucesso');
    },
    onError: (error: Error) => {
      console.error('[useDeleteAfter] Erro:', error);
      toast.error(`Erro ao remover registro: ${error.message}`);
    },
  });
}

// ============ FEEDBACK HOOKS ============
export function useFeedbacks() {
  return useQuery({
    queryKey: ['feedback'],
    queryFn: () => feedbackAPI.getAll(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}