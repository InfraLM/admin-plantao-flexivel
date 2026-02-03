import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Search, Calendar, AlertTriangle } from 'lucide-react';
import { useAlunos, useCreateTentativa } from '@/hooks/useApi';
import { PfAlunos } from '@/lib/database';
import { toast } from 'sonner';

export default function RegisterAttempt() {
    const [selectedAluno, setSelectedAluno] = useState<PfAlunos | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState('');
    const [successDate, setSuccessDate] = useState('');

    const { data: alunos = [] } = useAlunos();
    const createTentativaMutation = useCreateTentativa();

    const filteredAlunos = alunos.filter((a: PfAlunos) =>
        !selectedAluno && (
            (a.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (a.matricula || '').includes(searchTerm)
        )
    ).slice(0, 5);

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

        // Convert to dd/mm/yyyy
        const formatDate = (d: string) => {
            if (!d) return undefined;
            const [year, month, day] = d.split('-');
            return `${day}/${month}/${year}`;
        };

        const formattedDate = formatDate(date);
        const formattedSuccessDate = formatDate(successDate);

        createTentativaMutation.mutate({
            matricula: selectedAluno.matricula,
            data_possivel_plantao: formattedDate!,
            data_que_conseguiu: formattedSuccessDate,
        }, {
            onSuccess: () => {
                toast.success('Tentativa registrada com sucesso!');
                setDate('');
                setSuccessDate('');
                setSelectedAluno(null);
            },
            onError: (error: any) => {
                toast.error(error.message || 'Erro ao registrar tentativa');
            }
        });
    };

    return (
        <>
            <Header title="Registrar Tentativa" description="Registre tentativas de marcação de plantão" />

            <div className="page-container max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Nova Tentativa
                        </CardTitle>
                        <CardDescription>
                            Registre quando um aluno tentou marcar um plantão mas não conseguiu
                        </CardDescription>
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
                                        <p className="text-xs text-muted-foreground mt-1">Telefone: {selectedAluno.telefone || '-'}</p>
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
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Data Desejada (Tentativa)</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Quando o aluno queria o plantão
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Data Conquistada (Opcional)</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        value={successDate}
                                        onChange={(e) => setSuccessDate(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Quando o plantão foi efetivamente marcado
                                </p>
                            </div>
                        </div>

                        {/* Info Summary */}
                        {selectedAluno && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md text-sm space-y-1">
                                <p className="font-semibold text-amber-900 dark:text-amber-100">
                                    Informações do Aluno
                                </p>
                                <p><span className="font-medium">Plantões realizados:</span> {selectedAluno.qtd_plantoes || 0}</p>
                                <p><span className="font-medium">Situação Financeira:</span> {selectedAluno.status_financeiro || 'Indefinido'}</p>
                            </div>
                        )}

                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            onClick={handleSubmit}
                            disabled={!selectedAluno || !date || createTentativaMutation.isPending}
                        >
                            {createTentativaMutation.isPending ? 'Registrando...' : 'Registrar Tentativa'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Nota:</strong> A data da tentativa é o dia que o aluno entrou em contato/tentou agendar. Se ele conseguiu marcar para outra data, preencha o campo "Data Conquistada".
                    </p>
                </div>
            </div>
        </>
    );
}
