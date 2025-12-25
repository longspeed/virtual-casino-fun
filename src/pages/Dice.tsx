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
import { Dices, ArrowUp, ArrowDown } from 'lucide-react';
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
      toast.error('Insufficient balance!');
      return;
    }

    setRolling(true);
    setResult(null);

    // Animate rolling
    const animationDuration = 1000;
    const rollInterval = 50;
    let elapsed = 0;

    const interval = setInterval(() => {
      setLastRoll(rng.randomInt(1, 100));
      elapsed += rollInterval;

      if (elapsed >= animationDuration) {
        clearInterval(interval);
        
        // Final result
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
          toast.success(`You won ${diceResult.win.toLocaleString()} credits!`);
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold gold-text">Dice Game</h1>
          <p className="text-muted-foreground mt-2">
            Predict if the roll will be over or under your target!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            House Edge: {(houseEdge * 100).toFixed(1)}%
          </p>
        </div>

        {/* Dice Game */}
        <div className="casino-card">
          {/* Dice Display */}
          <div className="bg-secondary rounded-xl p-8 mb-6 text-center">
            <div className={cn(
              "inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-navy-deep border-4",
              rolling && "animate-pulse",
              result?.won ? "border-emerald" : result ? "border-crimson" : "border-gold/30"
            )}>
              <span className={cn(
                "font-display text-5xl font-bold",
                result?.won ? "text-emerald" : result ? "text-crimson" : "text-foreground"
              )}>
                {lastRoll ?? '?'}
              </span>
            </div>
          </div>

          {/* Result */}
          {result && !rolling && (
            <div className="mb-6">
              <ResultDisplay
                won={result.won}
                amount={result.amount}
                multiplier={result.multiplier}
              />
            </div>
          )}

          {/* Over/Under Toggle */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              variant={isOver ? 'emerald' : 'secondary'}
              size="lg"
              onClick={() => setIsOver(true)}
              disabled={rolling}
              className="gap-2"
            >
              <ArrowUp className="h-5 w-5" />
              Roll Over {target}
            </Button>
            <Button
              variant={!isOver ? 'crimson' : 'secondary'}
              size="lg"
              onClick={() => setIsOver(false)}
              disabled={rolling}
              className="gap-2"
            >
              <ArrowDown className="h-5 w-5" />
              Roll Under {target}
            </Button>
          </div>

          {/* Target Slider */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-muted-foreground">Target Number</span>
              <span className="font-display font-semibold text-gold">{target}</span>
            </div>
            <Slider
              value={[target]}
              onValueChange={([value]) => setTarget(value)}
              min={2}
              max={98}
              step={1}
              disabled={rolling}
              className="mb-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2</span>
              <span>50</span>
              <span>98</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-secondary/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Win Chance
              </p>
              <p className="font-display text-xl font-bold text-foreground">
                {winChance}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Multiplier
              </p>
              <p className="font-display text-xl font-bold text-gold">
                {multiplier.toFixed(2)}×
              </p>
            </div>
          </div>

          {/* Bet Controls */}
          <div className="mb-6">
            <BetControls
              bet={bet}
              onBetChange={setBet}
              maxBet={maxBet}
              disabled={rolling}
            />
          </div>

          {/* Potential Win */}
          <div className="text-center mb-6 p-3 bg-gold/10 rounded-lg border border-gold/20">
            <p className="text-xs text-muted-foreground">Potential Win</p>
            <p className="font-display text-2xl font-bold text-gold">
              {Math.floor(bet * multiplier).toLocaleString()} credits
            </p>
          </div>

          {/* Roll Button */}
          <Button
            variant="gold"
            size="xl"
            className="w-full"
            onClick={roll}
            disabled={rolling || bet > (state.user?.balance || 0)}
          >
            <Dices className="h-5 w-5" />
            {rolling ? 'Rolling...' : 'ROLL DICE'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
