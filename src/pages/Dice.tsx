import { useState } from 'react';
import { useCasino } from '@/context/CasinoContext';
import { Layout } from '@/components/Layout';
import { BetControls } from '@/components/BetControls';
import { ResultDisplay } from '@/components/ResultDisplay';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { rollDice, calculateDiceMultiplier } from '@/lib/gameLogic';
import { rng } from '@/lib/rng';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Dice() {
  const { state, placeBet, addWinnings, logGame } = useCasino();
  const [bet, setBet] = useState(100);
  const [target, setTarget] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [result, setResult] = useState<{ won: boolean; amount: number; multiplier: number } | null>(null);

  const maxBet = state.user?.balance || 1000;
  const houseEdge = state.settings.diceHouseEdge;
  const multiplier = calculateDiceMultiplier(target, isOver, houseEdge);
  const winChance = isOver ? 100 - target : target - 1;

  const roll = async () => {
    if (!state.user) return;
    if (!placeBet(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    setRolling(true);
    setResult(null);

    const animationDuration = 800;
    const rollInterval = 40;
    let elapsed = 0;

    const interval = setInterval(() => {
      setLastRoll(rng.randomInt(1, 100));
      elapsed += rollInterval;

      if (elapsed >= animationDuration) {
        clearInterval(interval);
        
        const diceResult = rollDice(target, isOver, bet, houseEdge);
        
        setLastRoll(diceResult.roll);
        setRolling(false);
        setResult({
          won: diceResult.won,
          amount: diceResult.won ? diceResult.win : bet,
          multiplier: diceResult.multiplier,
        });

        if (diceResult.won) {
          addWinnings(diceResult.win);
          toast.success(`Won ${diceResult.win.toLocaleString()} credits`);
        }

        logGame({
          game: 'dice',
          bet,
          result: `Roll: ${diceResult.roll} | Target: ${isOver ? '>' : '<'}${target}`,
          win: diceResult.win,
          balanceAfter: state.user!.balance + diceResult.win - bet,
          seed: rng.getSeed(),
        });
      }
    }, rollInterval);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-semibold">Dice</h1>
          <p className="text-xs text-muted-foreground">
            House edge: {(houseEdge * 100).toFixed(1)}%
          </p>
        </div>

        {/* Game Card */}
        <div className="game-card space-y-4">
          {/* Dice Display */}
          <div className="bg-secondary rounded-md p-8 text-center">
            <div className={cn(
              "inline-flex items-center justify-center w-24 h-24 rounded-md bg-background border-2",
              rolling && "opacity-70",
              result?.won ? "border-primary" : result ? "border-destructive" : "border-border"
            )}>
              <span className={cn(
                "mono text-4xl font-bold",
                result?.won ? "text-primary" : result ? "text-destructive" : "text-foreground"
              )}>
                {lastRoll ?? '?'}
              </span>
            </div>
          </div>

          {/* Result */}
          {result && !rolling && (
            <ResultDisplay
              won={result.won}
              amount={result.amount}
              multiplier={result.multiplier}
            />
          )}

          {/* Over/Under Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={isOver ? 'default' : 'secondary'}
              onClick={() => setIsOver(true)}
              disabled={rolling}
            >
              Over {target}
            </Button>
            <Button
              variant={!isOver ? 'destructive' : 'secondary'}
              onClick={() => setIsOver(false)}
              disabled={rolling}
            >
              Under {target}
            </Button>
          </div>

          {/* Target Slider */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Target</span>
              <span className="mono font-medium">{target}</span>
            </div>
            <Slider
              value={[target]}
              onValueChange={([value]) => setTarget(value)}
              min={2}
              max={98}
              step={1}
              disabled={rolling}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-secondary rounded-md">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Win Chance</p>
              <p className="mono font-bold">{winChance}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Multiplier</p>
              <p className="mono font-bold text-primary">{multiplier.toFixed(2)}×</p>
            </div>
          </div>

          {/* Potential Win */}
          <div className="text-center p-2 bg-primary/10 rounded-md border border-primary/20">
            <p className="text-xs text-muted-foreground">Potential Win</p>
            <p className="mono text-lg font-bold text-primary">
              {Math.floor(bet * multiplier).toLocaleString()}
            </p>
          </div>

          {/* Bet Controls */}
          <BetControls
            bet={bet}
            onBetChange={setBet}
            maxBet={maxBet}
            disabled={rolling}
          />

          {/* Roll Button */}
          <Button
            className="w-full"
            size="xl"
            onClick={roll}
            disabled={rolling || bet > (state.user?.balance || 0)}
          >
            {rolling ? 'Rolling...' : 'Roll'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
