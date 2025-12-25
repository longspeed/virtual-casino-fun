import { useState, useEffect } from 'react';
import { useCasino } from '@/context/CasinoContext';
import { Layout } from '@/components/Layout';
import { BetControls } from '@/components/BetControls';
import { ResultDisplay } from '@/components/ResultDisplay';
import { Button } from '@/components/ui/button';
import { spinSlots, calculateSlotWin, SLOT_SYMBOLS, SLOT_PAYTABLE, SlotSymbol } from '@/lib/gameLogic';
import { rng } from '@/lib/rng';
import { cn } from '@/lib/utils';
import { Play, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function Slots() {
  const { state, placeBet, addWinnings, logGame } = useCasino();
  const [bet, setBet] = useState(100);
  const [reels, setReels] = useState<SlotSymbol[]>(['🍒', '🍒', '🍒']);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ won: boolean; amount: number; multiplier: number } | null>(null);
  const [showPaytable, setShowPaytable] = useState(false);

  const maxBet = state.user?.balance || 1000;
  const rtp = state.settings.slotRTP;

  const spin = async () => {
    if (!state.user) return;
    if (!placeBet(bet)) {
      toast.error('Insufficient balance!');
      return;
    }

    setSpinning(true);
    setResult(null);

    // Animate reels
    const animationDuration = 1500;
    const spinInterval = 80;
    let elapsed = 0;

    const interval = setInterval(() => {
      setReels([
        rng.pick([...SLOT_SYMBOLS]),
        rng.pick([...SLOT_SYMBOLS]),
        rng.pick([...SLOT_SYMBOLS]),
      ]);
      elapsed += spinInterval;

      if (elapsed >= animationDuration) {
        clearInterval(interval);
        
        // Final result
        const finalReels = spinSlots(rtp);
        const { multiplier, win } = calculateSlotWin(finalReels, bet);
        
        setReels(finalReels);
        setSpinning(false);
        setResult({ won: win > 0, amount: win, multiplier });

        if (win > 0) {
          addWinnings(win);
          toast.success(`You won ${win.toLocaleString()} credits!`);
        }

        logGame({
          game: 'slots',
          bet,
          result: finalReels.join(' '),
          win,
          balanceAfter: state.user!.balance + win - bet,
          seed: rng.getSeed(),
        });
      }
    }, spinInterval);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold gold-text">Slot Machine</h1>
          <p className="text-muted-foreground mt-2">
            Match symbols to win! RTP: {(rtp * 100).toFixed(1)}%
          </p>
        </div>

        {/* Slot Machine */}
        <div className="casino-card">
          {/* Reels */}
          <div className="bg-secondary rounded-xl p-6 mb-6">
            <div className="flex justify-center gap-4">
              {reels.map((symbol, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-24 h-28 flex items-center justify-center rounded-lg bg-navy-deep border-2 border-gold/30 text-5xl",
                    spinning && "animate-pulse",
                    result?.won && "border-emerald shadow-lg shadow-emerald/30"
                  )}
                >
                  <span className={cn(spinning && "animate-bounce")}>
                    {symbol}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Result */}
          {result && !spinning && (
            <div className="mb-6">
              <ResultDisplay
                won={result.won}
                amount={result.amount}
                multiplier={result.multiplier}
              />
            </div>
          )}

          {/* Bet Controls */}
          <div className="mb-6">
            <BetControls
              bet={bet}
              onBetChange={setBet}
              maxBet={maxBet}
              disabled={spinning}
            />
          </div>

          {/* Spin Button */}
          <Button
            variant="gold"
            size="xl"
            className="w-full"
            onClick={spin}
            disabled={spinning || bet > (state.user?.balance || 0)}
          >
            <Play className="h-5 w-5" />
            {spinning ? 'Spinning...' : 'SPIN'}
          </Button>
        </div>

        {/* Paytable */}
        <div className="casino-card">
          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 font-display text-lg font-semibold">
              <Info className="h-5 w-5 text-gold" />
              Paytable
            </span>
            <span className="text-muted-foreground">
              {showPaytable ? '−' : '+'}
            </span>
          </button>

          {showPaytable && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              {Object.entries(SLOT_PAYTABLE)
                .sort(([, a], [, b]) => b - a)
                .map(([symbols, multiplier]) => (
                  <div
                    key={symbols}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50"
                  >
                    <span className="text-2xl tracking-wider">{symbols}</span>
                    <span className="font-display font-semibold text-gold">
                      {multiplier}×
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
