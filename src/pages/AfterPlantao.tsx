import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import { Clock, ClipboardCheck, Users, ArrowUpDown, Calendar, Filter } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePlantoes, useCreateAfter } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

export default function AfterPlantao() {
    const { data: plantoes = [], isLoading, isError, refetch } = usePlantoes();
    const createAfter = useCreateAfter();
    const [selectedPlantao, setSelectedPlantao] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        comparecimento: true,
        uti: '',
        cvc: false,
        pai: false,
        cardioversao: false,
        iot: false,
        dreno: false,
        sne_svd: false,
        protocolos_avc: false,
        paracentese: false,
        prona: false,
        marca_passo: false,
        extubacao: false,
        decanulacao: false,
        retirada_dreno: false,
        toracocentese: false,
        traqueostomia: false,
        puncao_liquorica: false,
        cateter_hemodialise: false,
        protocolo_me: false,
    });

    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showTodayOnly, setShowTodayOnly] = useState(false);

    const openShifts = plantoes.filter(p => p.status === 'Em Aberto');

    // Helper to parse DD/MM/YYYY
    const parseDate = (dateStr: string) => {
        if (!dateStr) return new Date(0);
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    };

    const filteredAndSortedShifts = useMemo(() => {
        let result = [...openShifts];

        // Filter by Today if enabled
        if (showTodayOnly) {
            // Get current date in GMT-3
            const now = new Date();
            const gmt3Date = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
            
            const todayStr = gmt3Date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            result = result.filter(p => p.data_plantao === todayStr);
        }

        // Sort by date
        result.sort((a, b) => {
            const dateA = parseDate(a.data_plantao);
            const dateB = parseDate(b.data_plantao);
            return sortOrder === 'asc' 
                ? dateA.getTime() - dateB.getTime() 
                : dateB.getTime() - dateA.getTime();
        });

        return result;
    }, [openShifts, sortOrder, showTodayOnly]);

    const handleOpenForm = (plantao: any) => {
        setSelectedPlantao(plantao);
        setFormData({
            comparecimento: true,
            uti: '',
            cvc: false,
            pai: false,
            cardioversao: false,
            iot: false,
            dreno: false,
            sne_svd: false,
            protocolos_avc: false,
            paracentese: false,
            prona: false,
            marca_passo: false,
            extubacao: false,
            decanulacao: false,
            retirada_dreno: false,
            toracocentese: false,
            traqueostomia: false,
            puncao_liquorica: false,
            cateter_hemodialise: false,
            protocolo_me: false,
        });
    };

    const handleCloseForm = () => {
        setSelectedPlantao(null);
    };

    const handleCheckboxChange = (field: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [field]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPlantao) return;

        const data = {
            matricula: selectedPlantao.matricula,
            nome: selectedPlantao.nome,
            telefone: selectedPlantao.telefone,
            data_plantao: selectedPlantao.data_plantao,
            ...formData,
        };

        await createAfter.mutateAsync(data);
        handleCloseForm();
    };

    if (isLoading) {
        return (
            <>
                <Header title="After Plantão" description="Preencher formulários de plantões realizados" />
                <PageLoading text="Carregando plantões..." />
            </>
        );
    }

    if (isError) {
        return (
            <>
                <Header title="After Plantão" description="Preencher formulários de plantões realizados" />
                <div className="page-container">
                    <PageError onRetry={refetch} />
                </div>
            </>
        );
    }

    return (
        <>
            <Header title="After Plantão" description="Preencher formulários de plantões realizados" />

            <div className="page-container">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Plantões em Aberto
                            </CardTitle>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={showTodayOnly ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setShowTodayOnly(!showTodayOnly)}
                                    className={cn("gap-2", showTodayOnly && "bg-primary text-primary-foreground")}
                                >
                                    <Calendar className="h-4 w-4" />
                                    Hoje
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <ArrowUpDown className="h-4 w-4" />
                                            Ordenar
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setSortOrder('desc')}>
                                            Mais Recentes
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortOrder('asc')}>
                                            Mais Antigos
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <CardDescription>
                            Selecione um plantão para preencher o formulário e marcá-lo como realizado
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredAndSortedShifts.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                Nenhum plantão em aberto no momento
                            </p>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {filteredAndSortedShifts.map((plantao, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => handleOpenForm(plantao)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-medium">{plantao.nome}</p>
                                                <p className="text-sm text-muted-foreground">{plantao.matricula}</p>
                                            </div>
                                            <Badge variant="secondary">
                                                <Users className="h-3 w-3 mr-1" />
                                                {plantao.status}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            <p>Data: {plantao.data_plantao}</p>
                                            {plantao.telefone && <p>Tel: {plantao.telefone}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Form Dialog */}
                <Dialog open={selectedPlantao !== null} onOpenChange={(open) => !open && handleCloseForm()}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ClipboardCheck className="h-5 w-5" />
                                Formulário After Plantão
                            </DialogTitle>
                            <DialogDescription>
                                {selectedPlantao && (
                                    <>
                                        {selectedPlantao.nome} - {selectedPlantao.data_plantao}
                                    </>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                            {/* Comparecimento Switch */}
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Compareceu ao Plantão?</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Se desmarcado, o plantão será registrado como falta/cancelado.
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.comparecimento}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, comparecimento: checked }))}
                                />
                            </div>

                            {formData.comparecimento && (
                                <>
                                    {/* UTI Dropdown */}
                                    <div className="space-y-2">
                                        <Label htmlFor="uti">UTI *</Label>
                                        <Select value={formData.uti} onValueChange={(value) => setFormData(prev => ({ ...prev, uti: value }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o UTI" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1</SelectItem>
                                                <SelectItem value="2">2</SelectItem>
                                                <SelectItem value="3">3</SelectItem>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="PA">PA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Boolean Fields */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-sm">Procedimentos Realizados</h3>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {[
                                                { field: 'cvc', label: 'CVC' },
                                                { field: 'pai', label: 'PAI' },
                                                { field: 'cardioversao', label: 'Cardioversão' },
                                                { field: 'iot', label: 'IOT' },
                                                { field: 'dreno', label: 'Dreno' },
                                                { field: 'sne_svd', label: 'SNE/SVD' },
                                                { field: 'protocolos_avc', label: 'Protocolos AVC' },
                                                { field: 'paracentese', label: 'Paracentese' },
                                                { field: 'prona', label: 'Prona' },
                                                { field: 'marca_passo', label: 'Marca-passo' },
                                                { field: 'extubacao', label: 'Extubação' },
                                                { field: 'decanulacao', label: 'Decanulação' },
                                                { field: 'retirada_dreno', label: 'Retirada de Dreno' },
                                                { field: 'toracocentese', label: 'Toracocentese' },
                                                { field: 'traqueostomia', label: 'Traqueostomia' },
                                                { field: 'puncao_liquorica', label: 'Punção Liquórica' },
                                                { field: 'cateter_hemodialise', label: 'Cateter Hemodiálise' },
                                                { field: 'protocolo_me', label: 'Protocolo ME' },
                                            ].map(({ field, label }) => (
                                                <div key={field} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={field}
                                                        checked={formData[field as keyof typeof formData] as boolean}
                                                        onCheckedChange={(checked) => handleCheckboxChange(field, checked as boolean)}
                                                    />
                                                    <Label htmlFor={field} className="cursor-pointer">{label}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-2 justify-end pt-4">
                                <Button type="button" variant="outline" onClick={handleCloseForm}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={!formData.uti || createAfter.isPending}>
                                    {createAfter.isPending ? 'Enviando...' : 'Confirmar e Marcar como Realizado'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
