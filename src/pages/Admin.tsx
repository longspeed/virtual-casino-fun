import { useState } from 'react';
import { useCasino } from '@/context/CasinoContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { spinSlots, calculateSlotWin, rollDice, spinRoulette } from '@/lib/gameLogic';
import { rng } from '@/lib/rng';
import { 
  Settings, 
  RefreshCw, 
  Trash2, 
  Play, 
  BarChart3,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { state, dispatch } = useCasino();
  const [simulations, setSimulations] = useState(1000);
  const [simulating, setSimulating] = useState(false);
  const [simResults, setSimResults] = useState<{
    game: string;
    runs: number;
    totalBet: number;
    totalWon: number;
    rtp: number;
  } | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Simple admin access (in production, use proper auth)
  const ADMIN_PASSWORD = 'test123';

  const unlockAdmin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsUnlocked(true);
      toast.success('Admin panel unlocked');
    } else {
      toast.error('Invalid password');
    }
  };

  const resetBalance = () => {
    dispatch({ type: 'RESET_BALANCE' });
    toast.success('Balance reset to default');
  };

  const clearLogs = () => {
    dispatch({ type: 'CLEAR_LOGS' });
    toast.success('Game logs cleared');
  };

  const updateSetting = (key: string, value: number | null) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
    toast.success('Settings updated');
  };

  const runSimulation = async (game: 'slots' | 'dice' | 'roulette') => {
    setSimulating(true);
    setSimResults(null);

    // Run async to not block UI
    await new Promise((resolve) => setTimeout(resolve, 100));

    const betAmount = 100;
    let totalBet = 0;
    let totalWon = 0;

    for (let i = 0; i < simulations; i++) {
      totalBet += betAmount;

      if (game === 'slots') {
        const reels = spinSlots(state.settings.slotRTP);
        const { win } = calculateSlotWin(reels, betAmount);
        totalWon += win;
      } else if (game === 'dice') {
        const result = rollDice(50, true, betAmount, state.settings.diceHouseEdge);
        totalWon += result.win;
      } else if (game === 'roulette') {
        const result = spinRoulette([{ type: 'red', amount: betAmount }]);
        totalWon += result.totalWin;
      }
    }

    setSimResults({
      game,
      runs: simulations,
      totalBet,
      totalWon,
      rtp: (totalWon / totalBet) * 100,
    });
    setSimulating(false);
  };

  if (!isUnlocked) {
    return (
      <Layout>
        <div className="max-w-md mx-auto">
          <div className="casino-card text-center">
            <Lock className="h-16 w-16 text-gold mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground mb-6">
              Enter password to access admin controls
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              (Hint: test123)
            </p>
            <div className="space-y-4">
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                onKeyDown={(e) => e.key === 'Enter' && unlockAdmin()}
              />
              <Button variant="gold" className="w-full" onClick={unlockAdmin}>
                <Unlock className="h-4 w-4" />
                Unlock
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold gold-text">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">
            Configure game settings and run fairness tests
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="casino-card">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="h-5 w-5 text-gold" />
              <h2 className="font-display text-xl font-semibold">Game Settings</h2>
            </div>

            <div className="space-y-6">
              {/* Default Balance */}
              <div>
                <label className="text-sm text-muted-foreground">
                  Default Starting Balance
                </label>
                <Input
                  type="number"
                  value={state.settings.defaultBalance}
                  onChange={(e) =>
                    updateSetting('defaultBalance', Number(e.target.value))
                  }
                  min={100}
                  max={1000000}
                  className="mt-2"
                />
              </div>

              {/* Slot RTP */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Slot Machine RTP</span>
                  <span className="font-semibold text-gold">
                    {(state.settings.slotRTP * 100).toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[state.settings.slotRTP * 100]}
                  onValueChange={([value]) =>
                    updateSetting('slotRTP', value / 100)
                  }
                  min={80}
                  max={99}
                  step={0.5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher RTP = more player-friendly
                </p>
              </div>

              {/* Dice House Edge */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Dice House Edge</span>
                  <span className="font-semibold text-gold">
                    {(state.settings.diceHouseEdge * 100).toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[state.settings.diceHouseEdge * 100]}
                  onValueChange={([value]) =>
                    updateSetting('diceHouseEdge', value / 100)
                  }
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>

              {/* RNG Seed */}
              <div>
                <label className="text-sm text-muted-foreground">
                  RNG Seed (blank = random)
                </label>
                <Input
                  type="number"
                  value={state.settings.rngSeed ?? ''}
                  onChange={(e) =>
                    updateSetting(
                      'rngSeed',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="Random seed"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Set a seed for reproducible results
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="casino-card">
            <div className="flex items-center gap-2 mb-6">
              <RefreshCw className="h-5 w-5 text-gold" />
              <h2 className="font-display text-xl font-semibold">Quick Actions</h2>
            </div>

            <div className="space-y-4">
              <Button
                variant="casino"
                className="w-full justify-start"
                onClick={resetBalance}
              >
                <RefreshCw className="h-4 w-4" />
                Reset User Balance to Default
              </Button>

              <Button
                variant="casino"
                className="w-full justify-start"
                onClick={clearLogs}
              >
                <Trash2 className="h-4 w-4" />
                Clear All Game Logs
              </Button>

              <Button
                variant="casino"
                className="w-full justify-start"
                onClick={() => rng.newSeed()}
              >
                <RefreshCw className="h-4 w-4" />
                Generate New RNG Seed
              </Button>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  Current RNG Seed: <code className="text-gold">{rng.getSeed()}</code>
                </p>
              </div>
            </div>
          </div>

          {/* Fairness Testing */}
          <div className="casino-card md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-gold" />
              <h2 className="font-display text-xl font-semibold">Fairness Testing</h2>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Run automated simulations to verify game fairness and RTP accuracy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground">
                  Number of Simulations
                </label>
                <Input
                  type="number"
                  value={simulations}
                  onChange={(e) => setSimulations(Number(e.target.value))}
                  min={100}
                  max={100000}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <Button
                variant="emerald"
                onClick={() => runSimulation('slots')}
                disabled={simulating}
              >
                <Play className="h-4 w-4" />
                Test Slots
              </Button>
              <Button
                variant="emerald"
                onClick={() => runSimulation('dice')}
                disabled={simulating}
              >
                <Play className="h-4 w-4" />
                Test Dice
              </Button>
              <Button
                variant="emerald"
                onClick={() => runSimulation('roulette')}
                disabled={simulating}
              >
                <Play className="h-4 w-4" />
                Test Roulette
              </Button>
            </div>

            {simulating && (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gold mx-auto mb-2" />
                <p className="text-muted-foreground">Running simulations...</p>
              </div>
            )}

            {simResults && !simulating && (
              <div className="bg-secondary rounded-lg p-6">
                <h3 className="font-display text-lg font-semibold mb-4 capitalize">
                  {simResults.game} Simulation Results
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Runs</p>
                    <p className="font-display text-xl font-bold">
                      {simResults.runs.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Total Bet</p>
                    <p className="font-display text-xl font-bold">
                      {simResults.totalBet.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Total Won</p>
                    <p className="font-display text-xl font-bold text-emerald">
                      {simResults.totalWon.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Actual RTP</p>
                    <p className="font-display text-xl font-bold text-gold">
                      {simResults.rtp.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Game Logs */}
          <div className="casino-card md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gold" />
                <h2 className="font-display text-xl font-semibold">
                  Game Logs ({state.gameLogs.length})
                </h2>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {state.gameLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No game logs yet. Play some games to see history here.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2">Time</th>
                      <th className="text-left py-2 px-2">Game</th>
                      <th className="text-right py-2 px-2">Bet</th>
                      <th className="text-left py-2 px-2">Result</th>
                      <th className="text-right py-2 px-2">Win</th>
                      <th className="text-right py-2 px-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.gameLogs.slice(0, 100).map((log) => (
                      <tr key={log.id} className="border-b border-border/50">
                        <td className="py-2 px-2 text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-2 capitalize">{log.game}</td>
                        <td className="py-2 px-2 text-right">{log.bet}</td>
                        <td className="py-2 px-2 text-xs">{log.result}</td>
                        <td className={`py-2 px-2 text-right font-medium ${
                          log.win > 0 ? 'text-emerald' : 'text-muted-foreground'
                        }`}>
                          {log.win > 0 ? `+${log.win}` : '0'}
                        </td>
                        <td className="py-2 px-2 text-right text-gold">
                          {log.balanceAfter}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
