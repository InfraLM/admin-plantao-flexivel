import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import { PfFeedback } from '@/lib/database';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Calendar, Clock, MapPin, Copy, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { useFeedbacks } from '@/hooks/useApi';

const ITEMS_PER_PAGE = 20;

export default function Feedback() {
    const { data: feedbacks = [], isLoading, isError, refetch } = useFeedbacks();
    
    // State
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFeedback, setSelectedFeedback] = useState<PfFeedback | null>(null);

    // Helpers
    const parseDate = (dateStr: string | null) => {
        if (!dateStr) return new Date(0);
        const [day, month, year] = dateStr.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    };

    // Derived Data
    const sortedFeedbacks = useMemo(() => {
        return [...feedbacks].sort((a, b) => {
            const dateA = parseDate(a.data);
            const dateB = parseDate(b.data);
            return sortOrder === 'asc' 
                ? dateA.getTime() - dateB.getTime() 
                : dateB.getTime() - dateA.getTime();
        });
    }, [feedbacks, sortOrder]);

    const totalPages = Math.ceil(sortedFeedbacks.length / ITEMS_PER_PAGE);
    const paginatedFeedbacks = sortedFeedbacks.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset page when sort changes
    const handleSortChange = (order: 'asc' | 'desc') => {
        setSortOrder(order);
        setCurrentPage(1);
    };

    if (isLoading) return <PageLoading text="Carregando feedbacks..." />;
    if (isError) return <PageError onRetry={refetch} />;

    // Helper for rendering rating badges
    const RatingBadge = ({ value }: { value: number | null }) => {
        if (!value) return <span className="text-muted-foreground">-</span>;
        let colorClass = "bg-red-100 text-red-800";
        if (value >= 9) colorClass = "bg-green-100 text-green-800";
        else if (value >= 7) colorClass = "bg-blue-100 text-blue-800";
        else if (value >= 5) colorClass = "bg-yellow-100 text-yellow-800";
        
        return <Badge className={`${colorClass} hover:${colorClass} border-0`}>{value}</Badge>;
    };

    return (
        <>
            <Header title="Feedbacks" description="Avaliações e feedbacks dos alunos" />
            
            <div className="page-container space-y-6">
                <Tabs defaultValue="listagem" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <TabsList>
                            <TabsTrigger value="listagem">Listagem</TabsTrigger>
                        </TabsList>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="ml-2">
                                    <ArrowUpDown className="mr-2 h-4 w-4" />
                                    Ordenar por Data
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSortChange('desc')}>
                                    Mais Recentes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSortChange('asc')}>
                                    Mais Antigos
                                </DropdownMenuItem>
                            </DropdownMenuContent>

                        </DropdownMenu>

                        <Button 
                            variant="default" 
                            size="sm" 
                            className="ml-auto gap-2"
                            onClick={() => {
                                const url = "https://lmedu.com.br/pfo-feedback/";
                                if (navigator.clipboard) {
                                    navigator.clipboard.writeText(url).then(() => {
                                        toast({
                                            title: "Link copiado!",
                                            description: "Link do formulário copiado para a área de transferência.",
                                        });
                                    }).catch(() => {
                                        toast({
                                            title: "Erro ao copiar",
                                            description: "Não foi possível copiar o link automaticamente.",
                                            variant: "destructive"
                                        });
                                    });
                                } else {
                                    // Fallback for older browsers or insecure contexts
                                    const textArea = document.createElement("textarea");
                                    textArea.value = url;
                                    document.body.appendChild(textArea);
                                    textArea.select();
                                    try {
                                        document.execCommand('copy');
                                        toast({
                                            title: "Link copiado!",
                                            description: "Link do formulário copiado para a área de transferência.",
                                        });
                                    } catch (err) {
                                        toast({
                                            title: "Erro ao copiar",
                                            description: "Por favor, copie manualmente: " + url,
                                            variant: "destructive"
                                        });
                                    }
                                    document.body.removeChild(textArea);
                                }
                            }}
                        >
                            <LinkIcon className="h-4 w-4" />
                            Copiar Link do Formulário
                        </Button>
                    </div>
                    {/* --- TAB: LISTAGEM --- */}
                    <TabsContent value="listagem">
                        <Card>
                            <CardHeader>
                                <CardTitle>Feedbacks Recebidos</CardTitle>
                                <CardDescription>
                                    Mostrando {paginatedFeedbacks.length} de {sortedFeedbacks.length} avaliações
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {paginatedFeedbacks.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-8">Nenhum feedback encontrado.</p>
                                    ) : (
                                        paginatedFeedbacks.map((f: PfFeedback) => (
                                            <div 
                                                key={f.id} 
                                                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                                onClick={() => setSelectedFeedback(f)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-start gap-4">
                                                        <div className="bg-primary/10 p-2 rounded-full hidden sm:block">
                                                            <Eye className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold text-lg">{f.setor || 'Setor não informado'}</h4>
                                                                <Badge variant="outline">{f.data}</Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                                {f.comentario_final || 'Sem comentários adicionais.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-xs text-muted-foreground mb-1">Nota Geral</span>
                                                            <RatingBadge value={f.avaliacao_geral} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center space-x-2 py-4 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Próxima
                                            <ChevronRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* --- FEEDBACK DETAILS DIALOG --- */}
                <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                Detalhes do Feedback
                                {selectedFeedback && <Badge variant="outline" className="ml-2">{selectedFeedback.id}</Badge>}
                            </DialogTitle>
                        </DialogHeader>
                        
                        {selectedFeedback && (
                            <div className="space-y-6 py-4">
                                {/* Header Info */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Data</span>
                                        <span className="font-medium">{selectedFeedback.data}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Hora</span>
                                        <span className="font-medium">{selectedFeedback.hora}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Setor</span>
                                        <span className="font-medium">{selectedFeedback.setor}</span>
                                    </div>
                                </div>

                                {/* Comentário Final */}
                                {selectedFeedback.comentario_final && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Comentário Final</h4>
                                        <p className="bg-muted p-4 rounded-lg italic border-l-4 border-primary">
                                            "{selectedFeedback.comentario_final}"
                                        </p>
                                    </div>
                                )}

                                {/* Ratings Grid (Infra) */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Avaliação Institucional</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm">Recepção</span>
                                            <RatingBadge value={selectedFeedback.recepcao_nota} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm">Estacionamento</span>
                                            <RatingBadge value={selectedFeedback.estacionamento_nota} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm">Rotina</span>
                                            <RatingBadge value={selectedFeedback.rotina_nota} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm">Estrutura</span>
                                            <RatingBadge value={selectedFeedback.estrutura_local} />
                                        </div>
                                    </div>
                                </div>

                                {/* Preceptors */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Avaliação de Preceptores</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                        {[
                                            { name: 'Gutemberque', note: selectedFeedback.gutemberque_nota, desc: selectedFeedback.gutemberque_ponto },
                                            { name: 'Candido', note: selectedFeedback.candido_nota, desc: selectedFeedback.candido_ponto },
                                            { name: 'João Paulo', note: selectedFeedback.joaopaulo_nota, desc: selectedFeedback.joaopaulo_ponto },
                                            { name: 'Ana Beatriz', note: selectedFeedback.anabeatriz_nota, desc: selectedFeedback.anabeatriz_ponto },
                                            { name: 'Leia', note: selectedFeedback.leia_nota, desc: selectedFeedback.leia_ponto },
                                            { name: 'Caio Barros', note: selectedFeedback.caiobarros_nota, desc: selectedFeedback.caiobarros_ponto },
                                            { name: 'Ianny', note: selectedFeedback.ianny_nota, desc: selectedFeedback.ianny_ponto },
                                            { name: 'Brenner', note: selectedFeedback.brenner_nota, desc: selectedFeedback.brenner_ponto },
                                            { name: 'Ian', note: selectedFeedback.ian_nota, desc: selectedFeedback.ian_ponto },
                                            { name: 'Cleto', note: selectedFeedback.cleto_nota, desc: selectedFeedback.cleto_ponto },
                                            { name: 'Humberto', note: selectedFeedback.humberto_nota, desc: selectedFeedback.humberto_ponto },
                                            { name: 'Lucas', note: selectedFeedback.lucas_nota, desc: selectedFeedback.lucas_ponto },
                                            { name: 'João Pedro', note: selectedFeedback.joaopedro_nota, desc: selectedFeedback.joaopedro_ponto },
                                            { name: 'Arthur', note: selectedFeedback.arthur_nota, desc: selectedFeedback.arthur_ponto },
                                            { name: 'Walter', note: selectedFeedback.walter_nota, desc: selectedFeedback.walter_ponto },
                                            { name: 'Fernando', note: selectedFeedback.fernando_nota, desc: selectedFeedback.fernando_ponto },
                                        ].filter(p => p.note !== null && p.note > 0).map(p => (
                                            <div key={p.name} className="flex flex-col gap-1 border-b border-dashed pb-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">{p.name}</span>
                                                    <RatingBadge value={p.note} />
                                                </div>
                                                {p.desc && <p className="text-xs text-muted-foreground">"{p.desc}"</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Learning */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Aprendizado</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex justify-between items-center bg-muted/30 p-2 rounded">
                                            <span className="text-sm">Desenvolvimento Técnico</span>
                                            <RatingBadge value={selectedFeedback.desenvolvimento_tecnico} />
                                        </div>
                                        <div className="flex justify-between items-center bg-muted/30 p-2 rounded">
                                            <span className="text-sm">Raciocínio Clínico</span>
                                            <RatingBadge value={selectedFeedback.raciocinio_clinico} />
                                        </div>
                                        <div className="flex justify-between items-center bg-muted/30 p-2 rounded">
                                            <span className="text-sm">Objetivo Atingido</span>
                                            <RatingBadge value={selectedFeedback.objetivo_atingido} />
                                        </div>
                                        <div className="flex justify-between items-center bg-muted/30 p-2 rounded">
                                            <span className="text-sm">Avaliação Geral do Plantão</span>
                                            <RatingBadge value={selectedFeedback.avaliacao_geral} />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold block mb-1">APRENDEU ALGO NOVO?</span>
                                            <span className="font-medium">{selectedFeedback.aprendeu_algo_novo ? 'SIM' : 'NÃO'}</span>
                                            </div>
                                    </div>
                                    
                                    {selectedFeedback.aprendeu_true_itens && selectedFeedback.aprendeu_true_itens.length > 0 && (
                                        <div className="mt-2">
                                            <span className="text-sm font-semibold">Itens aprendidos:</span>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedFeedback.aprendeu_true_itens.map((item, i) => (
                                                    <Badge key={i} variant="secondary">{item}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
