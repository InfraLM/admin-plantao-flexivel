import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { user } = useAuth();

  // Get initials from username
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium text-primary">
            {user?.username ? getInitials(user.username) : 'AD'}
          </span>
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-medium text-foreground">{user?.username || 'Admin'}</p>
          <p className="text-xs text-muted-foreground">Administrador</p>
        </div>
      </div>
    </header>
  );
}
