import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAlunos, useCreatePlantao } from '@/hooks/useApi';
import { PfAlunos } from '@/lib/database';
import { Search, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ShiftBooking() {
    const [selectedAluno, setSelectedAluno] = useState<PfAlunos | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState('');

    const { data: alunos = [] } = useAlunos();
    const createPlantaoMutation = useCreatePlantao();

    const filteredAlunos = alunos.filter((a: PfAlunos) =>
        !selectedAluno && (
            (a.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (a.matricula || '').includes(searchTerm)
        )
    ).slice(0, 5); // Limit suggestions

    const handleSelectAluno = (aluno: PfAlunos) => {
        setSelectedAluno(aluno);
        setSearchTerm('');
    };

    const handleClearSelection = () => {
        setSelectedAluno(null);
        setSearchTerm('');
    };

    const handleSubmit = () => {
        if (!selectedAluno || !date) {
            toast.error('Selecione um aluno e uma data');
            return;
        }

        // Format date to DD/MM/YYYY if needed, or keep ISO. 
        // The backend expects string. Let's send DD/MM/YYYY as per common BR format or ISO.
        // Input type="date" returns YYYY-MM-DD.
        // Let's format to DD/MM/YYYY for display/storage consistency if that's what backend expects.
        // Based on previous code, it seems to use strings. Let's use DD/MM/YYYY.
        const [year, month, day] = date.split('-');
        const formattedDate = `${day}/${month}/${year}`;

        createPlantaoMutation.mutate({
            matricula: selectedAluno.matricula,
            data_plantao: formattedDate,
            status: 'Em Aberto'
        }, {
            onSuccess: () => {
                toast.success('Plantão marcado com sucesso!');
                setDate('');
                setSelectedAluno(null);
            },
            onError: (error: any) => {
                toast.error(error.message || 'Erro ao marcar plantão');
            }
        });
    };

    return (
        <>
            <Header title="Marcar Plantão" description="Agende um novo plantão flexível" />

            <div className="page-container max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Nova Marcação</CardTitle>
                        <CardDescription>Selecione o aluno e a data do plantão.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Student Selection */}
                        <div className="space-y-2">
                            <Label>Aluno</Label>
                            {selectedAluno ? (
                                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                    <div>
                                        <p className="font-medium">{selectedAluno.nome}</p>
                                        <p className="text-sm text-muted-foreground">Matrícula: {selectedAluno.matricula}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                                        Trocar
                                    </Button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nome ou matrícula..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                    {searchTerm && filteredAlunos.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
                                            {filteredAlunos.map((aluno: PfAlunos) => (
                                                <div
                                                    key={aluno.matricula}
                                                    className="p-2 hover:bg-accent cursor-pointer text-sm"
                                                    onClick={() => handleSelectAluno(aluno)}
                                                >
                                                    <span className="font-medium">{aluno.nome}</span>
                                                    <span className="text-muted-foreground ml-2">({aluno.matricula})</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date Selection */}
                        <div className="space-y-2">
                            <Label>Data do Plantão</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* Info Summary */}
                        {selectedAluno && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md text-sm space-y-1">
                                <p><span className="font-semibold">Plantões já realizados:</span> {selectedAluno.qtd_plantoes || 0}</p>
                                <p><span className="font-semibold">Último plantão:</span> {selectedAluno.data_ultimo_plantao || 'Nenhum'}</p>
                                <p><span className="font-semibold">Situação Financeira:</span> {selectedAluno.parcelas_atraso && selectedAluno.parcelas_atraso > 0 ?
                                    <span className="text-destructive font-bold">Em Atraso ({selectedAluno.parcelas_atraso} parcelas)</span> :
                                    <span className="text-success font-bold">Em Dia</span>
                                }</p>
                            </div>
                        )}

                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            onClick={handleSubmit}
                            disabled={!selectedAluno || !date || createPlantaoMutation.isPending}
                        >
                            {createPlantaoMutation.isPending ? 'Marcando...' : 'Confirmar Plantão'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}
