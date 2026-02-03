import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageError } from '@/components/ui/ErrorMessage';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { usePlantoes } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

export default function Calendar() {
    const { data: plantoes = [], isLoading, isError, refetch } = usePlantoes();
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Format date to dd/mm/yyyy
    const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Get shifts grouped by date
    const shiftsByDate = useMemo(() => {
        const grouped: Record<string, typeof plantoes> = {};
        plantoes.forEach(plantao => {
            if (!grouped[plantao.data_plantao]) {
                grouped[plantao.data_plantao] = [];
            }
            grouped[plantao.data_plantao].push(plantao);
        });
        return grouped;
    }, [plantoes]);

    // Generate calendar month view
    const calendarDays = useMemo(() => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startDay = firstDay.getDay(); // 0 = Sunday
        const daysInMonth = lastDay.getDate();

        const days = [];

        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthLastDay - i);
            days.push({ date, isCurrentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            days.push({ date, isCurrentMonth: true });
        }

        // Next month days to complete the grid
        const remainingDays = 42 - days.length; // 6 weeks * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i);
            days.push({ date, isCurrentMonth: false });
        }

        return days;
    }, [selectedMonth]);

    const isToday = (date: Date): boolean => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const getShiftsForDate = (date: Date) => {
        const dateStr = formatDate(date);
        return shiftsByDate[dateStr] || [];
    };

    const getOpenShiftsCount = (shifts: typeof plantoes) => {
        return shifts.filter(shift => shift.status === 'Em Aberto').length;
    };

    const goToPreviousMonth = () => {
        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
    };

    const selectedDateShifts = selectedDate ? getShiftsForDate(selectedDate) : [];

    if (isLoading) {
        return (
            <>
                <Header title="Calendário" description="Visualização de plantões por data" />
                <PageLoading text="Carregando calendário..." />
            </>
        );
    }

    if (isError) {
        return (
            <>
                <Header title="Calendário" description="Visualização de plantões por data" />
                <div className="page-container">
                    <PageError onRetry={refetch} />
                </div>
            </>
        );
    }

    return (
        <>
            <Header title="Calendário" description="Visualização de plantões por data" />

            <div className="page-container">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>
                                {selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                            </CardTitle>
                            <div className="flex gap-2">
                                <button
                                    onClick={goToPreviousMonth}
                                    className="p-2 hover:bg-muted rounded-md transition-colors"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={goToNextMonth}
                                    className="p-2 hover:bg-muted rounded-md transition-colors"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                                <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-2">
                            {calendarDays.map(({ date, isCurrentMonth }, index) => {
                                const shifts = getShiftsForDate(date);
                                const openShiftsCount = getOpenShiftsCount(shifts);
                                const isCurrentDay = isToday(date);

                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleDateClick(date)}
                                        className={cn(
                                            "min-h-[80px] p-2 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                                            !isCurrentMonth && "opacity-40",
                                            isCurrentDay && "border-success bg-success/10",
                                            openShiftsCount > 0 && "bg-muted/30"
                                        )}
                                    >
                                        <div className="flex flex-col h-full">
                                            <span className={cn(
                                                "text-sm font-medium mb-1",
                                                isCurrentDay && "text-success font-bold"
                                            )}>
                                                {date.getDate()}
                                            </span>
                                            {openShiftsCount > 0 && (
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <Users className="h-3 w-3" />
                                                        <span className="font-medium">{openShiftsCount}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Details Dialog */}
                <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                {selectedDate && selectedDate.toLocaleDateString('pt-BR', {
                                    weekday: 'long',
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedDateShifts.length} {selectedDateShifts.length === 1 ? 'plantão agendado' : 'plantões agendados'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 mt-4">
                            {selectedDateShifts.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Nenhum plantão agendado para este dia
                                </p>
                            ) : (
                                selectedDateShifts.map((shift, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-3 h-3 rounded-full",
                                                shift.status === 'Realizado' && "bg-success",
                                                shift.status === 'Cancelado' && "bg-destructive",
                                                shift.status === 'Em Aberto' && "bg-amber-500"
                                            )} />
                                            <div>
                                                <p className="font-medium">{shift.nome}</p>
                                                <p className="text-sm text-muted-foreground">Matrícula: {shift.matricula}</p>
                                                {shift.telefone && (
                                                    <p className="text-sm text-muted-foreground">Tel: {shift.telefone}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant={
                                            shift.status === 'Realizado' ? 'default' :
                                                shift.status === 'Cancelado' ? 'destructive' :
                                                    'secondary'
                                        }>
                                            {shift.status}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
