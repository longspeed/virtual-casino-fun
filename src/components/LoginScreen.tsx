import { useState } from 'react';
import { useCasino } from '@/context/CasinoContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Users, AlertTriangle } from 'lucide-react';

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
    <div className="min-h-screen bg-background bg-casino-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Warning Banner */}
        <div className="mb-6 rounded-xl bg-crimson/10 border border-crimson/30 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-crimson mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold uppercase tracking-wide text-sm">
              Important Notice
            </span>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-sm text-foreground/80">
            This is a <strong>testing & simulation platform only</strong>.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            No real money • No crypto • No deposits • No withdrawals
          </p>
        </div>

        {/* Login Card */}
        <div className="casino-card animate-slide-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-dim mb-4 shadow-lg casino-glow">
              <span className="text-4xl">🎰</span>
            </div>
            <h1 className="font-display text-3xl font-bold gold-text">
              Virtual Casino
            </h1>
            <p className="text-muted-foreground mt-2">
              Test your luck with virtual credits
            </p>
          </div>

          {/* Starting Balance Info */}
          <div className="rounded-lg bg-secondary/50 p-4 mb-6 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              Starting Balance
            </p>
            <p className="font-display text-2xl font-bold text-gold text-center">
              {state.settings.defaultBalance.toLocaleString()} Credits
            </p>
          </div>

          {/* Login Options */}
          {!showUsernameInput ? (
            <div className="space-y-4">
              <Button
                variant="gold"
                size="xl"
                className="w-full"
                onClick={loginAsGuest}
              >
                <Users className="h-5 w-5" />
                Play as Guest
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                variant="casino"
                size="lg"
                className="w-full"
                onClick={() => setShowUsernameInput(true)}
              >
                <User className="h-5 w-5" />
                Enter Username
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Choose a Username
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username..."
                  autoFocus
                  maxLength={20}
                />
              </div>

              <div className="flex gap-3">
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
                  variant="gold"
                  className="flex-1"
                  disabled={!username.trim()}
                >
                  Start Playing
                </Button>
              </div>
            </form>
          )}

          {/* RTP Transparency */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              All games display their RTP (Return to Player) transparently.
              <br />
              This simulator is for testing purposes only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
