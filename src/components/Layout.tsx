import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCasino } from '@/context/CasinoContext';
import { Button } from '@/components/ui/button';
import { Coins, Dices, CircleDot, Settings, LogOut, User } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { state, logout } = useCasino();
  const location = useLocation();

  const navItems = [
    { path: '/slots', label: 'Slots', icon: Coins },
    { path: '/dice', label: 'Dice', icon: Dices },
    { path: '/roulette', label: 'Roulette', icon: CircleDot },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background bg-casino-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-dim">
                <span className="text-xl">🎰</span>
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-foreground">
                  Virtual Casino
                </h1>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Testing & Simulation Only
                </p>
              </div>
            </Link>

            {/* Navigation */}
            {state.user && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link key={path} to={path}>
                    <Button
                      variant={isActive(path) ? 'gold' : 'ghost'}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  </Link>
                ))}
              </nav>
            )}

            {/* User Info */}
            {state.user && (
              <div className="flex items-center gap-4">
                {/* Balance */}
                <div className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 border border-gold/20">
                  <Coins className="h-5 w-5 text-gold" />
                  <span className="font-display font-semibold text-gold">
                    {state.user.balance.toLocaleString()}
                  </span>
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-2">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-foreground">
                      {state.user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">Test Account</p>
                  </div>
                  
                  <Link to="/admin">
                    <Button variant="ghost" size="icon" title="Admin Panel">
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
        <nav className="md:hidden sticky top-16 z-40 border-b border-border bg-card/95 backdrop-blur">
          <div className="container mx-auto px-4">
            <div className="flex justify-center gap-2 py-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path}>
                  <Button
                    variant={isActive(path) ? 'gold' : 'ghost'}
                    size="sm"
                    className="gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xs:inline">{label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            ⚠️ <strong>FOR TESTING & SIMULATION ONLY</strong> ⚠️
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            No real money. No crypto. No deposits. No withdrawals.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            All balances are virtual test credits only.
          </p>
        </div>
      </footer>
    </div>
  );
}
