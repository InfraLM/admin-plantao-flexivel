import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Filter, Trash2, Pencil, ChevronLeft, ChevronRight, ArrowDownUp } from 'lucide-react';
import { usePlantoes, useUpdatePlantaoStatus, useDeletePlantao } from '@/hooks/useApi';
import { PfPlantoes } from '@/lib/database';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { toast } from 'sonner';

// Helper function to format date to dd/mm/yyyy in São Paulo timezone
const formatDateBR = (dateStr: string | null) => {
    if (!dateStr) return '-';

    // If already in dd/mm/yyyy format, return as is
    if (dateStr.includes('/')) return dateStr;

    // If in ISO format, convert
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch {
        return dateStr;
    }
};

const ITEMS_PER_PAGE = 20;

export default function ShiftStatus() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('todos');
    const [sortBy, setSortBy] = useState<string>('date-desc');
    const [currentPage, setCurrentPage] = useState(1);
    
    const [editingPlantao, setEditingPlantao] = useState<PfPlantoes | null>(null);
    const [editData, setEditData] = useState<Partial<PfPlantoes>>({});

    const { data: plantoes = [], isLoading, isError, refetch } = usePlantoes();
    const updateStatusMutation = useUpdatePlantaoStatus();
    const deletePlantaoMutation = useDeletePlantao();

    const filteredAndSortedPlantoes = useMemo(() => {
        let result = plantoes.filter((plantao: PfPlantoes) => {
            const matchesSearch =
                (plantao.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (plantao.matricula || '').includes(searchTerm);

            const matchesStatus = statusFilter === 'todos' || plantao.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        // Sorting
        result.sort((a: PfPlantoes, b: PfPlantoes) => {
             const [d1, m1, y1] = (a.data_plantao || '').split('/');
             const [d2, m2, y2] = (b.data_plantao || '').split('/');
             const dateA = new Date(parseInt(y1), parseInt(m1) - 1, parseInt(d1)).getTime();
             const dateB = new Date(parseInt(y2), parseInt(m2) - 1, parseInt(d2)).getTime();

             if (sortBy === 'date-desc') return dateB - dateA;
             if (sortBy === 'date-asc') return dateA - dateB;
             return 0;
        });

        return result;
    }, [plantoes, searchTerm, statusFilter, sortBy]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredAndSortedPlantoes.length / ITEMS_PER_PAGE);
    const paginatedPlantoes = filteredAndSortedPlantoes.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    
    // Reset to page 1 on filter change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sortBy]);

    const handleStatusChange = (plantao: PfPlantoes, newStatus: string) => {
        if (!plantao.data_plantao) return;

        updateStatusMutation.mutate({
            matricula: plantao.matricula,
            data_plantao: plantao.data_plantao,
            status: newStatus
        }, {
            onSuccess: () => {
                toast.success('Status atualizado');
                refetch();
            },
            onError: () => toast.error('Erro ao atualizar status')
        });
    };

    const handleDelete = (plantao: PfPlantoes) => {
        if (!plantao.data_plantao || !confirm('Tem certeza que deseja excluir este plantão?')) return;

        deletePlantaoMutation.mutate({
            matricula: plantao.matricula,
            data_plantao: plantao.data_plantao
        }, {
            onSuccess: () => {
                toast.success('Plantão excluído');
                refetch();
            },
            onError: () => toast.error('Erro ao excluir plantão')
        });
    };

    const handleEdit = (plantao: PfPlantoes) => {
        setEditingPlantao(plantao);
        setEditData({
            nome: plantao.nome || '',
            telefone: plantao.telefone || '',
            status: plantao.status || 'Em Aberto',
            data_plantao: plantao.data_plantao || '',
        });
    };

    const handleSaveEdit = () => {
        if (!editingPlantao || !editData.status) return;

        // Update status
        updateStatusMutation.mutate({
            matricula: editingPlantao.matricula,
            data_plantao: editingPlantao.data_plantao || '',
            status: editData.status
        }, {
            onSuccess: () => {
                toast.success('Plantão atualizado');
                setEditingPlantao(null);
                refetch();
            },
            onError: () => toast.error('Erro ao atualizar plantão')
        });
    };

    if (isLoading) return (
        <>
            <Header title="Status dos Plantões" description="Acompanhe os plantões agendados" />
            <PageLoading text="Carregando plantões..." />
        </>
    );

    if (isError) return (
        <>
            <Header title="Status dos Plantões" description="Acompanhe os plantões agendados" />
            <div className="page-container">
                <PageError onRetry={() => refetch()} />
            </div>
        </>
    );

    return (
        <>
            <Header title="Status dos Plantões" description="Acompanhe os plantões agendados" />

            <div className="page-container">
                {/* Filters */}
                <div className="flex flex-col gap-4 mb-6">
                    {/* Top Row: Search */}
                    <div className="relative w-full max-w-md">
                         <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por aluno..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    
                    {/* Bottom Row: Filters */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="Em Aberto">Em Aberto</SelectItem>
                                    <SelectItem value="Realizado">Realizado</SelectItem>
                                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                             <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                             <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Ordenar por" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date-desc">Data (Recentes)</SelectItem>
                                    <SelectItem value="date-asc">Data (Antigos)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                         <div className="ml-auto text-sm text-muted-foreground">
                            {filteredAndSortedPlantoes.length} registros
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Data Plantão</th>
                                    <th>Matrícula</th>
                                    <th>Aluno</th>
                                    <th>Telefone</th>
                                    <th>Marcado em</th>
                                    <th>Status</th>
                                    <th className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPlantoes.map((plantao: PfPlantoes) => (
                                    <tr key={`${plantao.matricula}-${plantao.data_plantao}`}>
                                        <td className="font-medium">{plantao.data_plantao}</td>
                                        <td className="font-mono text-sm">{plantao.matricula}</td>
                                        <td>{plantao.nome}</td>
                                        <td>{plantao.telefone}</td>
                                        <td className="text-muted-foreground text-sm">{formatDateBR(plantao.data_marcado)}</td>
                                        <td>
                                            {plantao.status === 'Realizado' ? (
                                                <StatusBadge status="Realizado" />
                                            ) : (
                                                <Select
                                                    value={plantao.status || 'Em Aberto'}
                                                    onValueChange={(v) => handleStatusChange(plantao, v)}
                                                >
                                                    <SelectTrigger className="h-8 w-[140px]">
                                                        <StatusBadge status={plantao.status || 'Em Aberto'} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Em Aberto">Em Aberto</SelectItem>
                                                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(plantao)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(plantao)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAndSortedPlantoes.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Nenhum plantão encontrado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                 {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                    </Button>
                    <div className="text-sm font-medium">
                        Página {currentPage} de {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    </div>
                )}


                {/* Edit Dialog */}
                <Dialog open={!!editingPlantao} onOpenChange={(open) => !open && setEditingPlantao(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Plantão</DialogTitle>
                        </DialogHeader>
                        {editingPlantao && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Matrícula</Label>
                                    <Input value={editingPlantao.matricula} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>Aluno</Label>
                                    <Input
                                        value={editData.nome || ''}
                                        onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                                        disabled
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefone</Label>
                                    <Input
                                        value={editData.telefone || ''}
                                        onChange={(e) => setEditData({ ...editData, telefone: e.target.value })}
                                        disabled
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data do Plantão</Label>
                                    <Input value={editingPlantao.data_plantao || ''} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    {editingPlantao.status === 'Realizado' ? (
                                        <Input value="Realizado" disabled />
                                    ) : (
                                        <Select
                                            value={editData.status || 'Em Aberto'}
                                            onValueChange={(v) => setEditData({ ...editData, status: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Em Aberto">Em Aberto</SelectItem>
                                                <SelectItem value="Cancelado">Cancelado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingPlantao(null)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveEdit}>
                                Salvar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
