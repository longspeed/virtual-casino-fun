import { useState } from 'react';
import { useCasino } from '@/context/CasinoContext';
import { Layout } from '@/components/Layout';
import { BetControls } from '@/components/BetControls';
import { ResultDisplay } from '@/components/ResultDisplay';
import { Button } from '@/components/ui/button';
import { spinRoulette, RouletteBet, RouletteBetType, ROULETTE_PAYOUTS, getRouletteRTP, RouletteColor } from '@/lib/gameLogic';
import { rng } from '@/lib/rng';
import { cn } from '@/lib/utils';
import { CircleDot, X } from 'lucide-react';
import { toast } from 'sonner';

const BETTING_OPTIONS: { type: RouletteBetType; label: string; color?: string }[] = [
  { type: 'red', label: 'Red', color: 'bg-crimson' },
  { type: 'black', label: 'Black', color: 'bg-primary-foreground' },
  { type: 'odd', label: 'Odd' },
  { type: 'even', label: 'Even' },
  { type: 'low', label: '1-18' },
  { type: 'high', label: '19-36' },
  { type: 'dozen1', label: '1st 12' },
  { type: 'dozen2', label: '2nd 12' },
  { type: 'dozen3', label: '3rd 12' },
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
      toast.error('Insufficient balance for this bet!');
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
      toast.error('Place at least one bet!');
      return;
    }

    if (!deductBet(totalBet)) {
      toast.error('Insufficient balance!');
      return;
    }

    setSpinning(true);
    setWinAmount(null);

    // Animate
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
        toast.success(`You won ${result.totalWin.toLocaleString()} credits!`);
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
    }, 2000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold gold-text">European Roulette</h1>
          <p className="text-muted-foreground mt-2">
            Single zero wheel • RTP: {(rtp * 100).toFixed(1)}%
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Wheel & Result */}
          <div className="lg:col-span-2 casino-card">
            {/* Wheel Display */}
            <div className="bg-secondary rounded-xl p-8 mb-6 text-center">
              <div className={cn(
                "inline-flex items-center justify-center w-36 h-36 rounded-full border-8",
                spinning && "animate-spin",
                lastResult?.color === 'red' && "border-crimson bg-crimson/20",
                lastResult?.color === 'black' && "border-foreground bg-foreground/10",
                lastResult?.color === 'green' && "border-emerald bg-emerald/20",
                !lastResult && "border-gold/30 bg-navy-deep"
              )}>
                <span className={cn(
                  "font-display text-5xl font-bold",
                  lastResult?.color === 'red' && "text-crimson",
                  lastResult?.color === 'black' && "text-foreground",
                  lastResult?.color === 'green' && "text-emerald",
                  !lastResult && "text-muted-foreground"
                )}>
                  {spinning ? '?' : (lastResult?.number ?? '?')}
                </span>
              </div>
            </div>

            {/* Result */}
            {winAmount !== null && !spinning && (
              <div className="mb-6">
                <ResultDisplay
                  won={winAmount > 0}
                  amount={winAmount > 0 ? winAmount : totalBet}
                />
              </div>
            )}

            {/* Number Grid */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">Straight Bets (35:1)</p>
              <div className="grid grid-cols-12 gap-1">
                {/* Zero */}
                <button
                  onClick={() => addBet('straight', 0)}
                  disabled={spinning}
                  className="col-span-12 py-2 rounded-lg bg-emerald text-foreground font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  0
                </button>
                {/* Numbers 1-36 */}
                {ROULETTE_NUMBERS.slice(1).map(({ num, color }) => (
                  <button
                    key={num}
                    onClick={() => addBet('straight', num)}
                    disabled={spinning}
                    className={cn(
                      "py-2 rounded text-foreground font-bold text-sm hover:opacity-80 transition-opacity disabled:opacity-50",
                      color === 'red' ? 'bg-crimson' : 'bg-foreground/90 text-background'
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Outside Bets */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">Outside Bets</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {BETTING_OPTIONS.map(({ type, label, color }) => (
                  <Button
                    key={type}
                    variant="secondary"
                    size="sm"
                    onClick={() => addBet(type)}
                    disabled={spinning}
                    className={cn("font-semibold", color)}
                  >
                    {label} ({ROULETTE_PAYOUTS[type]}:1)
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Betting Panel */}
          <div className="casino-card">
            <h3 className="font-display text-lg font-semibold mb-4">Place Bets</h3>

            {/* Bet Amount */}
            <div className="mb-6">
              <BetControls
                bet={betAmount}
                onBetChange={setBetAmount}
                maxBet={maxBet - totalBet}
                disabled={spinning}
              />
            </div>

            {/* Current Bets */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current Bets</span>
                {bets.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearBets}
                    disabled={spinning}
                    className="h-6 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-1">
                {bets.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Click on the table to place bets
                  </p>
                ) : (
                  bets.map((bet, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-sm py-1 px-2 bg-secondary/50 rounded"
                    >
                      <span>
                        {bet.type === 'straight' ? `#${bet.number}` : bet.type}
                      </span>
                      <span className="text-gold">{bet.amount}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total */}
            <div className="p-3 bg-secondary rounded-lg mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Bet</span>
                <span className="font-display font-bold text-gold">
                  {totalBet.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Spin Button */}
            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={spin}
              disabled={spinning || bets.length === 0}
            >
              <CircleDot className="h-5 w-5" />
              {spinning ? 'Spinning...' : 'SPIN'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
