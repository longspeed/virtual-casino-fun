import { useState } from 'react';
import { useCasino } from '@/context/CasinoContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginScreen() {
  const { login, loginAsGuest, state } = useCasino();
  const [username, setUsername] = useState('');
  const [showUsernameInput, setShowUsernameInput] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Login Card */}
        <div className="game-card">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              Casino Lab
            </h1>
            <p className="text-sm text-muted-foreground">
              Testing & simulation platform
            </p>
          </div>

          {/* Starting Balance */}
          <div className="rounded-md bg-secondary p-4 mb-6 text-center border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Starting Balance
            </p>
            <p className="mono text-2xl font-bold text-primary">
              {state.settings.defaultBalance.toLocaleString()}
            </p>
          </div>

          {/* Login Options */}
          {!showUsernameInput ? (
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={loginAsGuest}
              >
                Play as Guest
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowUsernameInput(true)}
              >
                Enter Username
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  autoFocus
                  maxLength={20}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowUsernameInput(false)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!username.trim()}
                >
                  Start
                </Button>
              </div>
            </form>
          )}

          {/* Notice */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              No real money. All credits are virtual.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
