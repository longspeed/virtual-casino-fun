import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCasino } from '@/context/CasinoContext';
import { Button } from '@/components/ui/button';
import { Settings, LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { state, logout } = useCasino();
  const location = useLocation();

  const navItems = [
    { path: '/slots', label: 'Slots' },
    { path: '/dice', label: 'Dice' },
    { path: '/roulette', label: 'Roulette' },
    { path: '/blackjack', label: 'Blackjack' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <span className="text-lg font-semibold text-foreground">
                Casino Lab
              </span>
              <span className="hidden sm:inline-flex text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-0.5 rounded bg-secondary border border-border">
                Simulation
              </span>
            </Link>

            {/* Navigation */}
            {state.user && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map(({ path, label }) => (
                  <Link key={path} to={path}>
                    <Button
                      variant={isActive(path) ? 'secondary' : 'ghost'}
                      size="sm"
                    >
                      {label}
                    </Button>
                  </Link>
                ))}
              </nav>
            )}

            {/* User Info */}
            {state.user && (
              <div className="flex items-center gap-3">
                {/* Balance */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border">
                  <span className="mono text-sm font-bold text-primary">
                    {state.user.balance.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">credits</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <span className="hidden sm:block text-sm text-muted-foreground mr-2">
                    {state.user.username}
                  </span>
                  
                  <Link to="/admin">
                    <Button variant="ghost" size="icon" title="Admin">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {state.user && (
        <nav className="md:hidden border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex justify-center gap-1 py-2">
              {navItems.map(({ path, label }) => (
                <Link key={path} to={path}>
                  <Button
                    variant={isActive(path) ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    {label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Simulation only — No real money involved
          </p>
        </div>
      </footer>
    </div>
  );
}
