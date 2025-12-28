import { useState } from 'react';
import { useCasino } from '@/context/CasinoContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { spinSlots, calculateSlotWin, rollDice, spinRoulette } from '@/lib/gameLogic';
import { rng } from '@/lib/rng';
import { 
  RefreshCw, 
  Trash2, 
  Play, 
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner';
import {
  validateDefaultBalance,
  validateSlotRTP,
  validateDiceHouseEdge,
  validateRNGSeed,
  BOUNDS,
} from '@/lib/validation';

// Get admin password from environment variable
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

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

  // If no admin password is set, disable admin panel
  const isAdminEnabled = ADMIN_PASSWORD.length > 0;

  const unlockAdmin = () => {
    if (!isAdminEnabled) {
      toast.error('Admin panel is disabled');
      return;
    }
    if (adminPassword === ADMIN_PASSWORD) {
      setIsUnlocked(true);
      toast.success('Admin panel unlocked');
    } else {
      toast.error('Invalid password');
    }
  };

  const resetBalance = () => {
    dispatch({ type: 'RESET_BALANCE' });
    toast.success('Balance reset');
  };

  const clearLogs = () => {
    dispatch({ type: 'CLEAR_LOGS' });
    toast.success('Logs cleared');
  };

  const updateSetting = (key: string, value: number | null) => {
    let validatedValue: number | null = value;

    // Validate and sanitize based on setting type
    if (key === 'defaultBalance' && value !== null) {
      validatedValue = validateDefaultBalance(value);
    } else if (key === 'slotRTP' && value !== null) {
      validatedValue = validateSlotRTP(value);
    } else if (key === 'diceHouseEdge' && value !== null) {
      validatedValue = validateDiceHouseEdge(value);
    } else if (key === 'rngSeed') {
      validatedValue = validateRNGSeed(value);
    }

    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: validatedValue } });
    toast.success('Settings updated');
  };

  const runSimulation = async (game: 'slots' | 'dice' | 'roulette') => {
    setSimulating(true);
    setSimResults(null);

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

  // If admin is disabled, show message
  if (!isAdminEnabled) {
    return (
      <Layout>
        <div className="max-w-sm mx-auto">
          <div className="game-card text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">
              Admin panel is disabled. Set VITE_ADMIN_PASSWORD environment variable to enable.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isUnlocked) {
    return (
      <Layout>
        <div className="max-w-sm mx-auto">
          <div className="game-card text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Enter password to access
            </p>
            <div className="space-y-3">
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Password"
                onKeyDown={(e) => e.key === 'Enter' && unlockAdmin()}
              />
              <Button className="w-full" onClick={unlockAdmin}>
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
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-semibold">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">
            Configure settings and test fairness
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Settings */}
          <div className="game-card space-y-5">
            <h2 className="font-medium">Game Settings</h2>

            <div>
              <label className="text-xs text-muted-foreground">
                Default Balance
              </label>
              <Input
                type="number"
                value={state.settings.defaultBalance}
                onChange={(e) =>
                  updateSetting('defaultBalance', Number(e.target.value))
                }
                min={BOUNDS.MIN_DEFAULT_BALANCE}
                max={BOUNDS.MAX_DEFAULT_BALANCE}
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Slot RTP</span>
                <span className="mono font-medium text-primary">
                  {(state.settings.slotRTP * 100).toFixed(1)}%
                </span>
              </div>
              <Slider
                value={[state.settings.slotRTP * 100]}
                onValueChange={([value]) =>
                  updateSetting('slotRTP', value / 100)
                }
                min={BOUNDS.MIN_SLOT_RTP * 100}
                max={BOUNDS.MAX_SLOT_RTP * 100}
                step={0.5}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Dice House Edge</span>
                <span className="mono font-medium text-primary">
                  {(state.settings.diceHouseEdge * 100).toFixed(1)}%
                </span>
              </div>
              <Slider
                value={[state.settings.diceHouseEdge * 100]}
                onValueChange={([value]) =>
                  updateSetting('diceHouseEdge', value / 100)
                }
                min={BOUNDS.MIN_DICE_HOUSE_EDGE * 100}
                max={BOUNDS.MAX_DICE_HOUSE_EDGE * 100}
                step={0.5}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
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
                placeholder="Random"
                className="mt-1"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="game-card space-y-4">
            <h2 className="font-medium">Quick Actions</h2>

            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={resetBalance}
            >
              <RefreshCw className="h-4 w-4" />
              Reset Balance
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={clearLogs}
            >
              <Trash2 className="h-4 w-4" />
              Clear Logs
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => rng.newSeed()}
            >
              <RefreshCw className="h-4 w-4" />
              New RNG Seed
            </Button>

            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Current Seed: <code className="mono text-primary">{rng.getSeed()}</code>
              </p>
            </div>
          </div>

          {/* Simulations */}
          <div className="game-card md:col-span-2 space-y-4">
            <h2 className="font-medium">Fairness Testing</h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">
                  Simulations
                </label>
                <Input
                  type="number"
                  value={simulations}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val >= 100 && val <= 100000) {
                      setSimulations(val);
                    }
                  }}
                  min={100}
                  max={100000}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => runSimulation('slots')}
                disabled={simulating}
              >
                <Play className="h-4 w-4" />
                Slots
              </Button>
              <Button
                variant="outline"
                onClick={() => runSimulation('dice')}
                disabled={simulating}
              >
                <Play className="h-4 w-4" />
                Dice
              </Button>
              <Button
                variant="outline"
                onClick={() => runSimulation('roulette')}
                disabled={simulating}
              >
                <Play className="h-4 w-4" />
                Roulette
              </Button>
            </div>

            {simulating && (
              <div className="text-center py-6">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Running...</p>
              </div>
            )}

            {simResults && !simulating && (
              <div className="bg-secondary rounded-md p-4">
                <h3 className="font-medium mb-3 capitalize">
                  {simResults.game} Results
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Runs</p>
                    <p className="mono font-bold">
                      {simResults.runs.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Bet</p>
                    <p className="mono font-bold">
                      {simResults.totalBet.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Won</p>
                    <p className="mono font-bold text-win">
                      {simResults.totalWon.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Actual RTP</p>
                    <p className="mono font-bold text-primary">
                      {simResults.rtp.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="game-card md:col-span-2">
            <h2 className="font-medium mb-3">
              Game Logs ({state.gameLogs.length})
            </h2>

            <div className="max-h-64 overflow-y-auto">
              {state.gameLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  No logs yet
                </p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-1">Time</th>
                      <th className="text-left py-2 px-1">Game</th>
                      <th className="text-right py-2 px-1">Bet</th>
                      <th className="text-left py-2 px-1">Result</th>
                      <th className="text-right py-2 px-1">Win</th>
                      <th className="text-right py-2 px-1">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.gameLogs.slice(0, 100).map((log) => (
                      <tr key={log.id} className="border-b border-border/50">
                        <td className="py-1.5 px-1 text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-1.5 px-1 capitalize">{log.game}</td>
                        <td className="py-1.5 px-1 text-right mono">{log.bet}</td>
                        <td className="py-1.5 px-1">{log.result}</td>
                        <td className={`py-1.5 px-1 text-right mono ${
                          log.win > 0 ? 'text-win' : 'text-muted-foreground'
                        }`}>
                          {log.win > 0 ? `+${log.win}` : '0'}
                        </td>
                        <td className="py-1.5 px-1 text-right mono text-primary">
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
