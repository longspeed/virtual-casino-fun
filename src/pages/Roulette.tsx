import { useState } from 'react';
import { useCasino } from '@/context/CasinoContext';
import { Layout } from '@/components/Layout';
import { BetControls } from '@/components/BetControls';
import { ResultDisplay } from '@/components/ResultDisplay';
import { Button } from '@/components/ui/button';
import { spinRoulette, RouletteBet, RouletteBetType, ROULETTE_PAYOUTS, getRouletteRTP, RouletteColor } from '@/lib/gameLogic';
import { rng } from '@/lib/rng';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const BETTING_OPTIONS: { type: RouletteBetType; label: string }[] = [
  { type: 'red', label: 'Red' },
  { type: 'black', label: 'Black' },
  { type: 'odd', label: 'Odd' },
  { type: 'even', label: 'Even' },
  { type: 'low', label: '1-18' },
  { type: 'high', label: '19-36' },
];

const ROULETTE_NUMBERS: { num: number; color: RouletteColor }[] = [
  { num: 0, color: 'green' },
  ...Array.from({ length: 36 }, (_, i) => ({
    num: i + 1,
    color: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(i + 1)
      ? 'red' as RouletteColor
      : 'black' as RouletteColor,
  })),
];

export default function Roulette() {
  const { state, placeBet: deductBet, addWinnings, logGame } = useCasino();
  const [betAmount, setBetAmount] = useState(100);
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<{ number: number; color: RouletteColor } | null>(null);
  const [winAmount, setWinAmount] = useState<number | null>(null);

  const maxBet = state.user?.balance || 1000;
  const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);
  const rtp = getRouletteRTP();

  const addBet = (type: RouletteBetType, number?: number) => {
    if (betAmount > (state.user?.balance || 0) - totalBet) {
      toast.error('Insufficient balance');
      return;
    }

    const existingBetIndex = bets.findIndex(
      (b) => b.type === type && b.number === number
    );

    if (existingBetIndex >= 0) {
      const updated = [...bets];
      updated[existingBetIndex].amount += betAmount;
      setBets(updated);
    } else {
      setBets([...bets, { type, number, amount: betAmount }]);
    }
  };

  const clearBets = () => {
    setBets([]);
    setWinAmount(null);
    setLastResult(null);
  };

  const spin = () => {
    if (!state.user || bets.length === 0) {
      toast.error('Place at least one bet');
      return;
    }

    if (!deductBet(totalBet)) {
      toast.error('Insufficient balance');
      return;
    }

    setSpinning(true);
    setWinAmount(null);

    setTimeout(() => {
      const result = spinRoulette(bets);
      
      setLastResult({
        number: result.pocket.number,
        color: result.pocket.color,
      });
      setSpinning(false);
      setWinAmount(result.totalWin);

      if (result.totalWin > 0) {
        addWinnings(result.totalWin);
        toast.success(`Won ${result.totalWin.toLocaleString()} credits`);
      }

      logGame({
        game: 'roulette',
        bet: totalBet,
        result: `${result.pocket.number} ${result.pocket.color}`,
        win: result.totalWin,
        balanceAfter: state.user!.balance + result.totalWin - totalBet,
        seed: rng.getSeed(),
      });

      setBets([]);
    }, 1500);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-semibold">Roulette</h1>
          <p className="text-xs text-muted-foreground">
            European wheel • RTP: {(rtp * 100).toFixed(1)}%
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          {/* Main Game Area */}
          <div className="lg:col-span-3 game-card space-y-4">
            {/* Wheel Display */}
            <div className="bg-secondary rounded-md p-6 text-center">
              <div className={cn(
                "inline-flex items-center justify-center w-28 h-28 rounded-full border-4",
                spinning && "animate-pulse",
                lastResult?.color === 'red' && "border-destructive bg-destructive/20",
                lastResult?.color === 'black' && "border-foreground bg-foreground/10",
                lastResult?.color === 'green' && "border-primary bg-primary/20",
                !lastResult && "border-border bg-background"
              )}>
                <span className={cn(
                  "mono text-4xl font-bold",
                  lastResult?.color === 'red' && "text-destructive",
                  lastResult?.color === 'black' && "text-foreground",
                  lastResult?.color === 'green' && "text-primary",
                  !lastResult && "text-muted-foreground"
                )}>
                  {spinning ? '?' : (lastResult?.number ?? '?')}
                </span>
              </div>
            </div>

            {/* Result */}
            {winAmount !== null && !spinning && (
              <ResultDisplay
                won={winAmount > 0}
                amount={winAmount > 0 ? winAmount : totalBet}
              />
            )}

            {/* Number Grid */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Straight (35:1)</p>
              <div className="grid grid-cols-12 gap-1">
                <button
                  onClick={() => addBet('straight', 0)}
                  disabled={spinning}
                  className="col-span-12 py-1.5 rounded text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  0
                </button>
                {ROULETTE_NUMBERS.slice(1).map(({ num, color }) => (
                  <button
                    key={num}
                    onClick={() => addBet('straight', num)}
                    disabled={spinning}
                    className={cn(
                      "py-1.5 rounded text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50",
                      color === 'red' ? 'bg-destructive text-destructive-foreground' : 'bg-foreground text-background'
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Outside Bets */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Outside Bets</p>
              <div className="grid grid-cols-3 gap-1.5">
                {BETTING_OPTIONS.map(({ type, label }) => (
                  <Button
                    key={type}
                    variant="secondary"
                    size="sm"
                    onClick={() => addBet(type)}
                    disabled={spinning}
                    className={cn(
                      "text-xs",
                      type === 'red' && "bg-destructive/20 hover:bg-destructive/30",
                      type === 'black' && "bg-foreground/10 hover:bg-foreground/20"
                    )}
                  >
                    {label} ({ROULETTE_PAYOUTS[type]}:1)
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Betting Panel */}
          <div className="lg:col-span-2 game-card space-y-4">
            <h3 className="font-medium">Place Bets</h3>

            {/* Bet Amount */}
            <BetControls
              bet={betAmount}
              onBetChange={setBetAmount}
              maxBet={maxBet - totalBet}
              disabled={spinning}
            />

            {/* Current Bets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Current Bets</span>
                {bets.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearBets}
                    disabled={spinning}
                    className="h-6 text-xs px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              <div className="max-h-32 overflow-y-auto space-y-1">
                {bets.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">
                    Click numbers or bets to add
                  </p>
                ) : (
                  bets.map((bet, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs py-1.5 px-2 bg-secondary rounded"
                    >
                      <span>
                        {bet.type === 'straight' ? `#${bet.number}` : bet.type}
                      </span>
                      <span className="mono text-primary">{bet.amount}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total */}
            <div className="p-2 bg-secondary rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="mono font-bold text-primary">
                  {totalBet.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Spin Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={spin}
              disabled={spinning || bets.length === 0}
            >
              {spinning ? 'Spinning...' : 'Spin'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
