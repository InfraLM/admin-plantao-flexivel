import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Calendar, AlertTriangle, CheckCircle2, XCircle, Clock, Filter, Activity, Heart, BarChart3 } from 'lucide-react';
import { useAlunos, usePlantoes, useTentativas, useAfter, useFeedbacks } from '@/hooks/useApi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
    FunnelChart, Funnel, LabelList
} from 'recharts';
import { format, subMonths, isWithinInterval, parse, startOfMonth, endOfMonth, eachMonthOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const STATUS_COLORS = {
    Adimplente: '#22c55e',
    Inadimplente: '#ef4444',
    Indefinido: '#94a3b8'
};

export default function Analytics() {
    const { data: alunos = [], isLoading: loadingAlunos, isError: errorAlunos, refetch: refetchAlunos } = useAlunos();
    const { data: plantoes = [], isLoading: loadingPlantoes, isError: errorPlantoes, refetch: refetchPlantoes } = usePlantoes();
    const { data: tentativas = [], isLoading: loadingTentativas, isError: errorTentativas, refetch: refetchTentativas } = useTentativas();
    const { data: afterRecords = [], isLoading: loadingAfter, isError: errorAfter, refetch: refetchAfter } = useAfter();
    const { data: feedbacks = [], isLoading: loadingFeedbacks, isError: errorFeedbacks, refetch: refetchFeedbacks } = useFeedbacks();

    // Date Filter State
    const [dateRange, setDateRange] = useState({
        start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });

    // --- DATA PROCESSING ---

    const stats = useMemo(() => {
        const totalAlunos = alunos.length;
        const adimplentes = alunos.filter(a => (a.status_financeiro || '').toUpperCase() === 'ADIMPLENTE').length;
        const inadimplentes = alunos.filter(a => (a.status_financeiro || '').toUpperCase() === 'INADIMPLENTE').length;
        const indefinidos = alunos.filter(a => !a.status_financeiro || (a.status_financeiro || '').toUpperCase() === 'INDEFINIDO').length;

        const totalPlantoes = plantoes.length;
        const plantoesRealizados = plantoes.filter(p => p.status === 'Realizado').length;
        const plantoesCancelados = plantoes.filter(p => p.status === 'Cancelado').length;

        // Calculate Occupancy Rate (Realized / (Realized + Open)) * 100 - Approximation
        // Better: Realized / Total Slots (assuming Total = Realized + Open + Cancelled is capacity? No, Cancelled frees up slot usually)
        // Let's use: Realized / (Realized + Open) as "Effective Occupancy of Available Slots"
        const plantoesAbertos = plantoes.filter(p => p.status === 'Em Aberto').length;
        const occupancyRate = plantoesRealizados + plantoesAbertos > 0
            ? ((plantoesRealizados / (plantoesRealizados + plantoesAbertos)) * 100).toFixed(1)
            : '0.0';

        const cancellationRate = totalPlantoes > 0
            ? ((plantoesCancelados / totalPlantoes) * 100).toFixed(1)
            : '0.0';

        // Absenteeism (No-Show) from After Records
        // Count records where comparecimento is false
        const noShows = afterRecords.filter(r => r.comparecimento === false).length;
        const totalAfter = afterRecords.length;
        const absenteeismRate = totalAfter > 0
            ? ((noShows / totalAfter) * 100).toFixed(1)
            : '0.0';

        const topAlunosByPlantoes = [...alunos].sort((a, b) => (b.qtd_plantoes || 0) - (a.qtd_plantoes || 0)).slice(0, 5);

        // Avg Days Wait Calculation
        let totalDaysWait = 0;
        let countDaysWait = 0;
        
        tentativas.forEach((t: any) => { // Using any for now as type might not be updated globally in this context
            if (t.data_possivel_plantao && t.data_que_conseguiu) {
                 const [d1, m1, y1] = t.data_possivel_plantao.split('/');
                 const [d2, m2, y2] = t.data_que_conseguiu.split('/');
                 
                 // date-fns parse
                 const desiredDate = new Date(parseInt(y1), parseInt(m1) - 1, parseInt(d1));
                 const achievedDate = new Date(parseInt(y2), parseInt(m2) - 1, parseInt(d2));
                 
                 const days = differenceInDays(achievedDate, desiredDate);
                 if (!isNaN(days)) {
                    totalDaysWait += Math.abs(days); // Use absolute just in case, but usually positive
                    countDaysWait++;
                 }
            }
        });
        
        const avgWaitDays = countDaysWait > 0 ? (totalDaysWait / countDaysWait).toFixed(1) : '0.0';

        return {
            totalAlunos, adimplentes, inadimplentes, indefinidos,
            totalPlantoes, plantoesRealizados, plantoesCancelados, plantoesAbertos,
            occupancyRate, cancellationRate, absenteeismRate,
            totalTentativas: tentativas.length,
            topAlunosByPlantoes,
            avgWaitDays
        };
    }, [alunos, plantoes, tentativas, afterRecords]);


    // 1. Funnel Data
    const funnelData = useMemo(() => {
        const totalCadastrados = alunos.length;
        // Total de Plantões Marcados (Demandas de Plantão - All shifts, regardless of status as requested)
        const totalPlantoesMarcados = plantoes.length;
        
        const realizaramPlantao = new Set(plantoes.filter(p => p.status === 'Realizado').map(p => p.matricula)).size; // Unique students
        // OR count of performed shifts? Funnel usually tracks users or volume. 
        // If "Total Plantões Marcados" is volume, "Realizaram Plantão" should probably be volume too for consistency?
        // But the previous metric "Tentaram Agendar" was unique students.
        // Let's stick to Volume for "Total Plantões Marcados" as requested, and keep others as is or adjust?
        // "Cadastrados" is Users.
        // "Total Plantões Marcados" is Events.
        // "Realizaram Plantão" was Unique Users.
        // This is a mixed funnel. Let's make it consistent? 
        // User asked "substitua por total de plantoes marcados".
        // I will keep others as they were (Students) unless it looks weird.
        // Changing "Tentaram Agendar" (Users) to "Total Plantões" (Events) breaks the funnel unit consistency.
        // BUT I must follow orders.
        const realizacoesVolume = plantoes.filter(p => p.status === 'Realizado').length;
        
        // Let's try to make it all Volume based or all User based?
        // "Cadastrados": Users.
        // "Total Plantões": Events.
        // If I switch to events, "Cadastrados" doesn't fit well.
        // Maybe "Total Plantões Marcados" means "Unique Students with Booked Shifts"?
        // "Tentaram Agendar" was distinct matriculas in `tentativas`.
        // If I change to "Total Plantões Marcados", I should probably use `plantoes.length` (Events) or `Set(plantoes.map(p=>p.matricula)).size` (Users).
        // Given the label "Total de Plantões...", strictly it implies count of shifts.
        // I will use `totalPlantoesMarcados` (Events).
        // And I will separate the Funnel visualization mentally.

        const preencheramAfter = new Set(afterRecords.map(r => r.matricula)).size;

        return [
            { name: 'Cadastrados', value: totalCadastrados, fill: '#8884d8' },
            { name: 'Total de Plantões Marcados', value: totalPlantoesMarcados, fill: '#83a6ed' },
            { name: 'Realizaram Plantão', value: realizacoesVolume, fill: '#8dd1e1' }, // Changed to volume for consistency with step 2? 
            // Currently Step 3 "Realizaram Plantão" was unique users.
            // If Step 2 is volume (e.g. 500), and Step 3 is users (e.g. 50), the funnel drops huge.
            // If Step 2 is Users with shifts (e.g. 60), it's consistent.
            // "Total de Plantões Marcados" strongly suggests volume.
            // I will change Step 3 to Volume too (plantoesRealizados).
            // Step 4 "Preencheram After" -> Volume of After records?
            // Let's use `afterRecords.length`.
            { name: 'Preencheram After', value: afterRecords.length, fill: '#82ca9d' },
        ];
    }, [alunos, tentativas, plantoes, afterRecords]);


    // ... (Demand vs Supply remains same) ...



    // 2. Demand vs Supply (Monthly)
    const demandSupplyData = useMemo(() => {
        const dataMap: Record<string, { month: string, realizados: number, tentativas: number }> = {};

        // Helper to get YYYY-MM
        const getMonthKey = (dateStr: string) => {
            if (!dateStr) return null;
            const [day, month, year] = dateStr.split('/');
            return `${year}-${month}`; // YYYY-MM
        };

        // Process Realizados
        plantoes.forEach(p => {
            if (p.status === 'Realizado') {
                const key = getMonthKey(p.data_plantao);
                if (key) {
                    if (!dataMap[key]) dataMap[key] = { month: key, realizados: 0, tentativas: 0 };
                    dataMap[key].realizados++;
                }
            }
        });

        // Process Tentativas (using data_possivel_plantao)
        tentativas.forEach(t => {
            const key = getMonthKey(t.data_possivel_plantao);
            if (key) {
                if (!dataMap[key]) dataMap[key] = { month: key, realizados: 0, tentativas: 0 };
                dataMap[key].tentativas++;
            }
        });

        return Object.values(dataMap)
            .sort((a, b) => a.month.localeCompare(b.month))
            .map(d => {
                const [year, month] = d.month.split('-');
                return {
                    ...d,
                    name: `${month}/${year}`
                };
            });
    }, [plantoes, tentativas]);

    // 3. Procedures Heatmap & Distribution
    const proceduresData = useMemo(() => {
        const proceduresList = [
            'cvc', 'pai', 'cardioversao', 'iot', 'dreno',
            'sne_svd', 'protocolos_avc', 'paracentese', 'prona', 'marca_passo',
            'extubacao', 'decanulacao', 'retirada_dreno', 'toracocentese',
            'traqueostomia', 'puncao_liquorica', 'cateter_hemodialise',
            'protocolo_me'
        ];

        // Total counts
        const totals = proceduresList.map(proc => ({
            name: proc.toUpperCase().replace('_', '/'),
            value: afterRecords.filter(r => r[proc as keyof typeof r] === true).length
        })).sort((a, b) => b.value - a.value);

        // Heatmap data (Procedure x UTI)
        const utis = ['1', '2', '3', '4', '5', 'PA'];
        const heatmap: Record<string, Record<string, number>> = {};

        proceduresList.forEach(proc => {
            heatmap[proc] = {};
            utis.forEach(uti => {
                heatmap[proc][uti] = 0;
            });
        });

        afterRecords.forEach(record => {
            if (record.uti && utis.includes(record.uti)) {
                proceduresList.forEach(proc => {
                    if (record[proc as keyof typeof record] === true) {
                        heatmap[proc][record.uti]++;
                    }
                });
            }
        });

        return { totals, heatmap, proceduresList, utis };
    }, [afterRecords]);

    // 4. Weekly Temporal Metrics (Filtered)
    const weeklyTemporalData = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return [];

        const start = parse(dateRange.start, 'yyyy-MM-dd', new Date());
        const end = parse(dateRange.end, 'yyyy-MM-dd', new Date());

        // Filter plantoes within range
        const filteredPlantoes = plantoes.filter(p => {
            if (!p.data_plantao) return false;
            const [day, month, year] = p.data_plantao.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return isWithinInterval(date, { start, end });
        });

        // Group by week
        const dataMap: Record<string, { date: Date, marcados: number, cancelamentos: number }> = {};

        filteredPlantoes.forEach(p => {
            const [day, month, year] = p.data_plantao.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const weekStart = startOfWeek(date, { locale: ptBR });
            const key = format(weekStart, 'yyyy-MM-dd');

            if (!dataMap[key]) dataMap[key] = { date: weekStart, marcados: 0, cancelamentos: 0 };

            // Count all shifts as "marcados" (scheduled)
            dataMap[key].marcados++;
            
            // Count only canceled shifts
            if (p.status === 'Cancelado') dataMap[key].cancelamentos++;
        });

        return Object.values(dataMap)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(d => ({
                name: `Sem ${format(d.date, 'dd/MM', { locale: ptBR })}`,
                marcados: d.marcados,
                cancelamentos: d.cancelamentos
            }));

    }, [plantoes, dateRange]);

    // 5. Monthly Temporal Metrics (Filtered)
    const monthlyTemporalData = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return [];

        const start = parse(dateRange.start, 'yyyy-MM-dd', new Date());
        const end = parse(dateRange.end, 'yyyy-MM-dd', new Date());

        // Filter plantoes within range
        const filteredPlantoes = plantoes.filter(p => {
            if (!p.data_plantao) return false;
            const [day, month, year] = p.data_plantao.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return isWithinInterval(date, { start, end });
        });

        // Group by month
        const dataMap: Record<string, { date: string, marcados: number, cancelamentos: number }> = {};

        filteredPlantoes.forEach(p => {
            const [day, month, year] = p.data_plantao.split('/');
            const key = `${year}-${month}`; // YYYY-MM

            if (!dataMap[key]) dataMap[key] = { date: key, marcados: 0, cancelamentos: 0 };

            // Count all shifts as "marcados" (scheduled)
            dataMap[key].marcados++;
            
            // Count only canceled shifts
            if (p.status === 'Cancelado') dataMap[key].cancelamentos++;
        });

        return Object.values(dataMap)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(d => {
                const [year, month] = d.date.split('-');
                return {
                    name: `${month}/${year}`,
                    marcados: d.marcados,
                    cancelamentos: d.cancelamentos
                };
            });

    }, [plantoes, dateRange]);

    // 5. Financial Distribution
    const financialData = useMemo(() => {
        const counts = {
            Adimplente: 0,
            Inadimplente: 0,
            Indefinido: 0
        };
        alunos.forEach(a => {
            const status = (a.status_financeiro || 'Indefinido');
            // Normalize
            if (status.toUpperCase() === 'ADIMPLENTE') counts.Adimplente++;
            else if (status.toUpperCase() === 'INADIMPLENTE') counts.Inadimplente++;
            else counts.Indefinido++;
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [alunos]);

    // 6. Class Activity (Stacked Bar)
    const classData = useMemo(() => {
        const classes: Record<string, { active: number, inactive: number }> = {};

        alunos.forEach(a => {
            const turma = a.turma || 'Sem Turma';
            if (!classes[turma]) classes[turma] = { active: 0, inactive: 0 };

            if ((a.qtd_plantoes || 0) > 0) classes[turma].active++;
            else classes[turma].inactive++;
        });

        return Object.entries(classes).map(([name, data]) => ({
            name,
            Ativos: data.active,
            Inativos: data.inactive
        }));
    }, [alunos]);

    // 7. First Time Shifts per Month
    const firstTimeData = useMemo(() => {
        const firstPlantaoMap = new Map(); // matricula -> Date

        plantoes.forEach(p => {
            if (p.status === 'Realizado' && p.data_plantao) {
                const [day, month, year] = p.data_plantao.split('/');
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

                if (!firstPlantaoMap.has(p.matricula)) {
                    firstPlantaoMap.set(p.matricula, date);
                } else {
                    const existingDate = firstPlantaoMap.get(p.matricula);
                    if (date < existingDate) {
                        firstPlantaoMap.set(p.matricula, date);
                    }
                }
            }
        });

        // Group by Month
        const monthlyCounts: Record<string, number> = {};

        firstPlantaoMap.forEach((date) => {
            const key = format(date, 'yyyy-MM');
            monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
        });

        return Object.entries(monthlyCounts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, count]) => {
                const [year, month] = key.split('-');
                return {
                    name: `${month}/${year}`,
                    value: count
                };
            });
    }, [plantoes]);

    // 8. Feedback Analysis Data (Full historical data)
    const feedbackFullData = useMemo(() => {
        return feedbacks;
    }, [feedbacks]);

    const feedbackAnalysis = useMemo(() => {
        const calculateAverage = (data: any[], key: string, maxScale: number = 5) => {
            const validValues = data
                .map(f => f[key])
                .filter(v => typeof v === 'number' && v > 0);
            
            if (validValues.length === 0) return 0;
            const sum = validValues.reduce((a, b) => a + b, 0);
            return parseFloat((sum / validValues.length).toFixed(1));
        };

        const infraData = [
            { name: 'Recepção', nota: calculateAverage(feedbackFullData, 'recepcao_nota') },
            { name: 'Estacionamento', nota: calculateAverage(feedbackFullData, 'estacionamento_nota') },
            { name: 'Rotina', nota: calculateAverage(feedbackFullData, 'rotina_nota') },
            { name: 'Estrutura Local', nota: calculateAverage(feedbackFullData, 'estrutura_local') },
        ];

        const satisfactionData = [
            // DB 0-5 -> UI 0-10 (Evaluation General)
            { name: 'Avaliação Geral', nota: parseFloat((calculateAverage(feedbackFullData, 'avaliacao_geral') * 2).toFixed(1)) },
            // DB 0-10 -> UI 0-10 (Objective Reached)
            { name: 'Objetivo Atingido', nota: calculateAverage(feedbackFullData, 'objetivo_atingido') },
        ];

        // Evolution (0-5)
        const evolutionData = [
            { name: 'Técnicas e Proc.', nota: calculateAverage(feedbackFullData, 'desenvolvimento_tecnico') },
            { name: 'Raciocínio Clínico', nota: calculateAverage(feedbackFullData, 'raciocinio_clinico') },
            // Idle time: 100% -> 5, 0% -> 0
            { name: 'Tempo Ocioso', nota: parseFloat(((calculateAverage(feedbackFullData, 'tempo_ocioso_porcentagem') || 0) / 20).toFixed(1)) },
        ];

        // General Opinions (0-5)
        const opinionData = [
            { name: 'Estrutura Física', nota: calculateAverage(feedbackFullData, 'estrutura_local') },
            { name: 'Relação Time', nota: calculateAverage(feedbackFullData, 'relacao_time') },
        ];

        // Preceptors
        const preceptors = [
            'gutemberque', 'candido', 'joaopaulo', 'anabeatriz', 'leia', 'caiobarros', 
            'ianny', 'brenner', 'ian', 'cleto', 'humberto', 'lucas', 'joaopedro', 
            'arthur', 'walter', 'fernando'
        ];

        const preceptorRatings = preceptors.map(p => ({
            name: p.charAt(0).toUpperCase() + p.slice(1).replace('paul', ' Paul'),
            nota: calculateAverage(feedbackFullData, `${p}_nota`)
        })).filter(p => p.nota > 0).sort((a, b) => b.nota - a.nota);

        const preceptorCounts = preceptors.map(p => ({
            name: p.charAt(0).toUpperCase() + p.slice(1).replace('paul', ' Paul'),
            count: feedbackFullData.filter(f => f[`${p}_nota`] && f[`${p}_nota`] > 0).length
        })).filter(p => p.count > 0).sort((a, b) => b.count - a.count);

        // Learning Pie
        const learningCounts = {
            sim: feedbackFullData.filter(f => f.aprendeu_algo_novo === true).length,
            nao: feedbackFullData.filter(f => f.aprendeu_algo_novo === false).length
        };
        const learningData = [
            { name: 'Sim', value: learningCounts.sim, fill: '#22c55e' },
            { name: 'Não', value: learningCounts.nao, fill: '#ef4444' }
        ];

        return { infraData, satisfactionData, preceptorRatings, preceptorCounts, learningData, evolutionData, opinionData };
    }, [feedbackFullData]);

    // 9. Feedback Temporal Data (Filtered)
    const feedbackTemporalData = useMemo(() => {
        const start = parse(dateRange.start, 'yyyy-MM-dd', new Date());
        const end = parse(dateRange.end, 'yyyy-MM-dd', new Date());

        return feedbacks.filter(f => {
            if (!f.data) return false;
            const [day, month, year] = f.data.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return isWithinInterval(date, { start, end });
        });
    }, [feedbacks, dateRange]);

    const weeklyFeedbackTemporalData = useMemo(() => {
        const dataMap: Record<string, { date: Date, ratings: number[], objectives: number[] }> = {};

        feedbackTemporalData.forEach(f => {
            const [day, month, year] = f.data!.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const weekStart = startOfWeek(date, { locale: ptBR });
            const key = format(weekStart, 'yyyy-MM-dd');

            if (!dataMap[key]) dataMap[key] = { date: weekStart, ratings: [], objectives: [] };
            
            if (f.avaliacao_geral) dataMap[key].ratings.push(f.avaliacao_geral * 2); // Scale to 10
            if (f.objetivo_atingido) dataMap[key].objectives.push(f.objetivo_atingido);
        });

        return Object.values(dataMap)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(d => ({
                name: `Sem ${format(d.date, 'dd/MM', { locale: ptBR })}`,
                'Avaliação Geral': d.ratings.length > 0 ? parseFloat((d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(1)) : 0,
                'Objetivo Atingido': d.objectives.length > 0 ? parseFloat((d.objectives.reduce((a, b) => a + b, 0) / d.objectives.length).toFixed(1)) : 0
            }));
    }, [feedbackTemporalData]);

    const monthlyFeedbackTemporalData = useMemo(() => {
        const dataMap: Record<string, { date: string, ratings: number[], objectives: number[] }> = {};

        feedbackTemporalData.forEach(f => {
            const [day, month, year] = f.data!.split('/');
            const key = `${year}-${month}`;

            if (!dataMap[key]) dataMap[key] = { date: key, ratings: [], objectives: [] };
            
            if (f.avaliacao_geral) dataMap[key].ratings.push(f.avaliacao_geral * 2); // Scale to 10
            if (f.objetivo_atingido) dataMap[key].objectives.push(f.objetivo_atingido);
        });

        return Object.values(dataMap)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(d => {
                const [year, month] = d.date.split('-');
                return {
                    name: `${month}/${year}`,
                    'Avaliação Geral': d.ratings.length > 0 ? parseFloat((d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(1)) : 0,
                    'Objetivo Atingido': d.objectives.length > 0 ? parseFloat((d.objectives.reduce((a, b) => a + b, 0) / d.objectives.length).toFixed(1)) : 0
                };
            });
    }, [feedbackTemporalData]);

    const isLoading = loadingAlunos || loadingPlantoes || loadingTentativas || loadingAfter || loadingFeedbacks;
    const isError = errorAlunos || errorPlantoes || errorTentativas || errorAfter || errorFeedbacks;

    if (isLoading) return (
        <>
            <Header title="Análise" description="Visão geral do sistema" />
            <PageLoading text="Carregando análises..." />
        </>
    );

    if (isError) return (
        <>
            <Header title="Análise" description="Visão geral do sistema" />
            <div className="page-container">
                <PageError onRetry={() => { refetchAlunos(); refetchPlantoes(); refetchTentativas(); refetchAfter(); }} />
            </div>
        </>
    );

    return (
        <>
            <Header title="Análise" description="Dashboards e métricas de performance" />

            <div className="page-container space-y-6">

                {/* Top Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Alunos</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalAlunos}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.adimplentes} Adimplentes
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Plantões Realizados</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.plantoesRealizados}</div>
                            <p className="text-xs text-muted-foreground">
                                Taxa de Ocupação: {stats.occupancyRate}%
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tentativas</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTentativas}</div>
                            <p className="text-xs text-muted-foreground">
                                Demanda total registrada
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Feedbacks</CardTitle>
                            <Heart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{feedbacks.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Avaliações recebidas
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="plantoes" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        <TabsTrigger value="plantoes">Análise de Plantões</TabsTrigger>
                        <TabsTrigger value="checagem">Checagem (Procedimentos)</TabsTrigger>
                        <TabsTrigger value="temporal">Métricas Temporais</TabsTrigger>
                        <TabsTrigger value="alunos">Análise de Alunos</TabsTrigger>
                        <TabsTrigger value="feedbacks">Análise de Feedbacks</TabsTrigger>
                    </TabsList>

                    {/* --- TAB: PLANTÕES --- */}
                    <TabsContent value="plantoes" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            {/* Funnel Chart */}
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Funil de Engajamento (Volume)</CardTitle>
                                    <CardDescription>Fluxo de plantões: Marcados {'->'} Realizados {'->'} Avaliados</CardDescription>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <FunnelChart>
                                                <Tooltip />
                                                <Funnel
                                                    data={funnelData}
                                                    dataKey="value"
                                                >
                                                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                                                </Funnel>
                                            </FunnelChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* KPIs Extra */}
                            <Card className="col-span-3">
                                <CardHeader>
                                    <CardTitle>Indicadores Operacionais</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">Taxa de Cancelamento</p>
                                            <p className="text-2xl font-bold text-destructive">{stats.cancellationRate}%</p>
                                        </div>
                                        <div className="ml-auto font-medium">Critico se {'>'} 20%</div>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">Média de dias de tentativa</p>
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.avgWaitDays} dias</p>
                                        </div>
                                        <div className="ml-auto font-medium">Espera média</div>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">Plantões em Aberto</p>
                                            <p className="text-2xl font-bold text-warning">{stats.plantoesAbertos}</p>
                                        </div>
                                        <div className="ml-auto font-medium">Vagas disponíveis</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Demand vs Supply */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Demanda vs Oferta</CardTitle>
                                <CardDescription>Comparativo mensal entre tentativas de agendamento e plantões realizados</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={demandSupplyData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="tentativas" name="Tentativas (Demanda)" stroke="#ff7300" strokeWidth={2} />
                                            <Line type="monotone" dataKey="realizados" name="Realizados (Oferta)" stroke="#387908" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* First Time Shifts */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Novos Alunos em Plantão</CardTitle>
                                <CardDescription>Quantidade de alunos realizando o primeiro plantão por mês</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={firstTimeData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="value" name="Primeira Vez" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- TAB: CHECAGEM (PROCEDIMENTOS) --- */}
                    <TabsContent value="checagem" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Procedures Distribution */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Procedimentos Mais Realizados</CardTitle>
                                    <CardDescription>Total acumulado de procedimentos</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={proceduresData.totals}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="name" type="category" width={100} />
                                                <Tooltip />
                                                <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Heatmap Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Mapa de Calor: Procedimentos x UTI</CardTitle>
                                    <CardDescription>Distribuição de procedimentos por unidade</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr>
                                                    <th className="p-2">Proc.</th>
                                                    {proceduresData.utis.map(uti => (
                                                        <th key={uti} className="p-2 text-center">{uti === 'PA' ? 'PA' : `UTI ${uti}`}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {proceduresData.proceduresList.map(proc => (
                                                    <tr key={proc} className="border-b">
                                                        <td className="p-2 font-medium">{proc.toUpperCase().replace('_', '/')}</td>
                                                        {proceduresData.utis.map(uti => {
                                                            const count = proceduresData.heatmap[proc][uti];
                                                            // Simple heatmap coloring logic
                                                            let bgClass = 'bg-transparent';
                                                            if (count > 0) bgClass = 'bg-blue-100 dark:bg-blue-900/20';
                                                            if (count > 5) bgClass = 'bg-blue-200 dark:bg-blue-900/40';
                                                            if (count > 10) bgClass = 'bg-blue-300 dark:bg-blue-900/60';
                                                            if (count > 20) bgClass = 'bg-blue-400 dark:bg-blue-900/80';

                                                            return (
                                                                <td key={uti} className={`p-2 text-center ${bgClass}`}>
                                                                    {count > 0 ? count : '-'}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* --- TAB: MÉTRICAS TEMPORAIS --- */}
                    <TabsContent value="temporal" className="space-y-4">
                        {/* Date Filters */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Filtros de Período</CardTitle>
                                        <CardDescription>Selecione o intervalo de datas para análise</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="start">Início</Label>
                                            <Input
                                                id="start"
                                                type="date"
                                                value={dateRange.start}
                                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="end">Fim</Label>
                                            <Input
                                                id="end"
                                                type="date"
                                                value={dateRange.end}
                                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Weekly and Monthly Graphs */}
                        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                            {/* Weekly Graph */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Análise Semanal</CardTitle>
                                    <CardDescription>Plantões marcados e cancelamentos por semana</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={weeklyTemporalData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="marcados" 
                                                    name="Plantões Marcados" 
                                                    stroke="#22c55e" 
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="cancelamentos" 
                                                    name="Cancelamentos" 
                                                    stroke="#ef4444" 
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Monthly Graph */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Análise Mensal</CardTitle>
                                    <CardDescription>Plantões marcados e cancelamentos por mês</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={monthlyTemporalData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="marcados" 
                                                    name="Plantões Marcados" 
                                                    stroke="#22c55e" 
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="cancelamentos" 
                                                    name="Cancelamentos" 
                                                    stroke="#ef4444" 
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Feedback Evolution Graphs */}
                        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 mt-4">
                            {/* Weekly Feedback Graph */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Evolução da Satisfação (Semanal)</CardTitle>
                                    <CardDescription>Média de avaliação e objetivo por semana (0-10)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={weeklyFeedbackTemporalData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis domain={[0, 10]} />
                                                <Tooltip />
                                                <Legend />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="Avaliação Geral" 
                                                    stroke="#22c55e" 
                                                    strokeWidth={2} 
                                                    dot={{ r: 4 }} 
                                                    activeDot={{ r: 6 }} 
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="Objetivo Atingido" 
                                                    stroke="#ef4444" 
                                                    strokeWidth={2} 
                                                    dot={{ r: 4 }} 
                                                    activeDot={{ r: 6 }} 
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Monthly Feedback Graph */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Evolução da Satisfação (Mensal)</CardTitle>
                                    <CardDescription>Média de avaliação e objetivo por mês (0-10)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={monthlyFeedbackTemporalData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis domain={[0, 10]} />
                                                <Tooltip />
                                                <Legend />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="Avaliação Geral" 
                                                    stroke="#22c55e" 
                                                    strokeWidth={2} 
                                                    dot={{ r: 4 }} 
                                                    activeDot={{ r: 6 }} 
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="Objetivo Atingido" 
                                                    stroke="#ef4444" 
                                                    strokeWidth={2} 
                                                    dot={{ r: 4 }} 
                                                    activeDot={{ r: 6 }} 
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* --- TAB: ALUNOS --- */}
                    <TabsContent value="alunos" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            {/* Financial Pie Chart */}
                            <Card className="col-span-3">
                                <CardHeader>
                                    <CardTitle>Distribuição Financeira</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={financialData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {financialData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Class Activity */}
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Atividade por Turma</CardTitle>
                                    <CardDescription>Alunos ativos vs inativos por turma</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={classData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="Ativos" stackId="a" fill="#82ca9d" />
                                                <Bar dataKey="Inativos" stackId="a" fill="#e2e8f0" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="col-span-7 border-none shadow-none bg-muted/60">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Top Alunos (Plantões)</CardTitle>
                                    <CardDescription>Alunos com mais plantões realizados</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {stats.topAlunosByPlantoes.map((aluno, i) => (
                                            <Card key={i} className="bg-background">
                                                <CardContent className="p-4 flex flex-col gap-2">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium leading-none truncate" title={aluno.nome}>{aluno.nome}</p>
                                                        <p className="text-xs text-muted-foreground">{aluno.matricula}</p>
                                                    </div>
                                                    <div className="font-bold text-2xl text-primary">{aluno.qtd_plantoes}</div>
                                                    <p className="text-xs text-muted-foreground">plantões realizados</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* --- TAB: FEEDBACKS --- */}
                    <TabsContent value="feedbacks" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Infraestrutura e Rotina */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Infraestrutura e Rotina</CardTitle>
                                    <CardDescription>Média de avaliações (0-5)</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={feedbackAnalysis.infraData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" domain={[0, 5]} />
                                            <YAxis dataKey="name" type="category" width={120} />
                                            <Tooltip />
                                            <Bar dataKey="nota" fill="#8884d8" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Satisfação Geral */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Gráfico de Satisfação</CardTitle>
                                    <CardDescription>Avaliação Geral e Objetivo (0-10)</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={feedbackAnalysis.satisfactionData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis domain={[0, 10]} />
                                            <Tooltip />
                                            <Bar dataKey="nota" fill="#82ca9d" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Evolução do Aluno */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Evolução do Aluno</CardTitle>
                                    <CardDescription>Habilidades e Performance (0-5)</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={feedbackAnalysis.evolutionData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis domain={[0, 5]} />
                                            <Tooltip />
                                            <Bar dataKey="nota" fill="#3b82f6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Opiniões Gerais */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Opiniões Gerais</CardTitle>
                                    <CardDescription>Estrutura e Equipe (0-5)</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={feedbackAnalysis.opinionData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis domain={[0, 5]} />
                                            <Tooltip />
                                            <Bar dataKey="nota" fill="#f59e0b" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            {/* Preceptores: Ranking */}
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Avaliação de Preceptores (Média)</CardTitle>
                                    <CardDescription>Média de avaliação do preceptor pelo aluno (0-5)</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={feedbackAnalysis.preceptorRatings} margin={{ bottom: 100 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={100} />
                                            <YAxis domain={[0, 5]} />
                                            <Tooltip />
                                            <Bar dataKey="nota" fill="#ffc658" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Preceptores: Contagem */}
                            <Card className="md:col-span-1">
                                <CardHeader>
                                    <CardTitle>Acompanhamento de Preceptores</CardTitle>
                                    <CardDescription>Número de vezes que cada preceptor acompanhou um aluno</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={feedbackAnalysis.preceptorCounts} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={100} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Aprendizado Pizza */}
                            <Card className="md:col-span-1">
                                <CardHeader>
                                    <CardTitle>Aprendeu algo novo?</CardTitle>
                                    <CardDescription>Distribuição de respostas Sim/Não</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={feedbackAnalysis.learningData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    dataKey="value"
                                                >
                                                    {feedbackAnalysis.learningData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
