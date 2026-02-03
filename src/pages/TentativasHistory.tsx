import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Calendar, User, ArrowDownUp, CheckCircle2, Clock } from 'lucide-react';
import { useTentativas } from '@/hooks/useApi';
import { differenceInDays, parse } from 'date-fns';

export default function TentativasHistory() {
    const { data: tentativas = [], isLoading, isError, refetch } = useTentativas();
    const [sortBy, setSortBy] = useState('date-desc');

    const processedTentativas = useMemo(() => {
        const enriched = tentativas.map(t => {
            let daysGap = null;
            if (t.data_possivel_plantao && t.data_que_conseguiu) {
                const [d1, m1, y1] = t.data_possivel_plantao.split('/');
                const [d2, m2, y2] = t.data_que_conseguiu.split('/');
                const desired = new Date(parseInt(y1), parseInt(m1) - 1, parseInt(d1));
                const achieved = new Date(parseInt(y2), parseInt(m2) - 1, parseInt(d2));
                daysGap = differenceInDays(achieved, desired);
            }
            return { ...t, daysGap };
        });

        return enriched.sort((a, b) => {
            switch (sortBy) {
                case 'gap-desc':
                    return (b.daysGap || 0) - (a.daysGap || 0);
                case 'gap-asc':
                    return (a.daysGap || 0) - (b.daysGap || 0);
                case 'date-desc':
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(); // Assuming created_at exists or sorting by ID conceptually
                // Fallback to sorting by data_tentativa if created_at missing, but string sort might be weak. 
                // Let's rely on array order usually being 'newest first' from SQL? 
                // Creating explicit sort if needed based on 'data_tentativa'.
                 case 'tentativa-desc':
                    // dd/mm/yyyy
                    const [d3, m3, y3] = (a.data_tentativa || '').split('/');
                    const [d4, m4, y4] = (b.data_tentativa || '').split('/');
                    return new Date(parseInt(y4), parseInt(m4)-1, parseInt(d4)).getTime() - new Date(parseInt(y3), parseInt(m3)-1, parseInt(d3)).getTime();
                default:
                    return 0;
            }
        });
    }, [tentativas, sortBy]);

    if (isLoading) {
        return (
            <>
                <Header title="Histórico de Tentativas" description="Tentativas de agendamento sem sucesso" />
                <PageLoading text="Carregando tentativas..." />
            </>
        );
    }

    if (isError) {
        return (
            <>
                <Header title="Histórico de Tentativas" description="Tentativas de agendamento sem sucesso" />
                <div className="page-container">
                    <PageError onRetry={refetch} />
                </div>
            </>
        );
    }

    return (
        <>
            <Header title="Histórico de Tentativas" description="Registro de tentativas de agendamento" />

            <div className="page-container">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <h2 className="text-lg font-semibold">Total: {tentativas.length} tentativas</h2>
                    </div>

                    <div className="flex items-center gap-2">
                         <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                         <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date-desc">Recentes</SelectItem>
                                <SelectItem value="tentativa-desc">Data Tentativa</SelectItem>
                                <SelectItem value="gap-desc">Maior Atraso (Gap)</SelectItem>
                                <SelectItem value="gap-asc">Menor Atraso (Gap)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {processedTentativas.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <p className="text-center text-muted-foreground">
                                Nenhuma tentativa registrada
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {processedTentativas.map((tentativa, idx) => (
                            <Card key={idx} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        {tentativa.nome}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                         <div className="text-sm flex justify-between">
                                            <span className="text-muted-foreground">Matrícula:</span>
                                            <Badge variant="outline">{tentativa.matricula}</Badge>
                                        </div>
                                        {tentativa.telefone && (
                                            <div className="text-sm flex justify-between">
                                                <span className="text-muted-foreground">Telefone:</span> 
                                                <span>{tentativa.telefone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                                <Calendar className="h-3 w-3" />
                                                <span>Data Tentativa</span>
                                            </div>
                                            <p className="font-medium text-sm">{tentativa.data_tentativa}</p>
                                        </div>
                                         <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                                <Calendar className="h-3 w-3" />
                                                <span>Data Desejada</span>
                                            </div>
                                            <p className="font-medium text-sm">{tentativa.data_possivel_plantao}</p>
                                        </div>
                                    </div>

                                    {(tentativa.data_que_conseguiu || tentativa.daysGap !== null) && (
                                        <div className="pt-2 border-t bg-muted/30 -mx-6 px-6 py-2 mt-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                        <span>Conseguiu em</span>
                                                    </div>
                                                    <p className="font-medium text-sm">{tentativa.data_que_conseguiu || '-'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                                        <Clock className="h-3 w-3 text-orange-600" />
                                                        <span>Dias de Atraso</span>
                                                    </div>
                                                    <p className={`font-bold text-sm ${tentativa.daysGap && tentativa.daysGap > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                                        {tentativa.daysGap !== null ? `${Math.abs(tentativa.daysGap)} dias` : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
