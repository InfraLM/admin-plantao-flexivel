import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar as CalendarIcon,
  CalendarDays,
  Activity,
  LogOut,
  ListChecks,
  AlertTriangle,
  ClipboardCheck,
  History,
  BarChart3
} from 'lucide-react';

// Navegação única
const navigation = [
  { name: 'Checagem Alunos', href: '/students', icon: Users },
  { name: 'Marcar Plantão', href: '/booking', icon: CalendarIcon },
  { name: 'Registrar Tentativa', href: '/register-attempt', icon: AlertTriangle },
  { name: 'Status Plantões', href: '/status', icon: ListChecks },
  { name: 'Calendário', href: '/calendar', icon: CalendarDays },
  { name: 'After Plantão', href: '/after-plantao', icon: ClipboardCheck },
  { name: 'Tentativas', href: '/tentativas', icon: History },
  { name: 'Feedbacks', href: '/feedback', icon: ClipboardCheck },
  { name: 'Análise', href: '/analytics', icon: BarChart3 },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Activity className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Plantão Flexível</span>
            <span className="text-xs text-sidebar-foreground/60">Gestão</span>
          </div>
        </div>
        {/* User Info */}
        {user && (
          <div className="px-3 py-3 border-b border-sidebar-border">
            <div className="rounded-lg bg-sidebar-accent/50 p-3">
              <p className="text-xs text-sidebar-foreground/70">Logado como</p>
              <p className="text-sm font-medium text-sidebar-foreground capitalize">{user.username}</p>
            </div>
          </div>
        )}
        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.filter(item => {
             // Se for analista, remove itens restritos
             if (user?.role === 'analista') {
               return !['Marcar Plantão', 'Registrar Tentativa', 'After Plantão'].includes(item.name);
             }
             return true;
          }).map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer with Logout */}
        <div className="border-t border-sidebar-border p-4 space-y-3">
          <Button
            className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-xs text-sidebar-foreground/70">
              Sistema de Gestão
            </p>
            <p className="text-xs font-medium text-sidebar-foreground">
              Versão 2.6.1
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}