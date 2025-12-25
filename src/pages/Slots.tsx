import { useState, useEffect } from 'react';
import { useCasino } from '@/context/CasinoContext';
import { Layout } from '@/components/Layout';
import { BetControls } from '@/components/BetControls';
import { ResultDisplay } from '@/components/ResultDisplay';
import { Button } from '@/components/ui/button';
import { spinSlots, calculateSlotWin, SLOT_SYMBOLS, SLOT_PAYTABLE, SlotSymbol } from '@/lib/gameLogic';
import { rng } from '@/lib/rng';
import { cn } from '@/lib/utils';
import { ChevronDown, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { audioManager } from '@/lib/audio';

export default function Slots() {
  const { state, placeBet, addWinnings, logGame, updateStreak } = useCasino();
  const [bet, setBet] = useState(100);
  const [reels, setReels] = useState<SlotSymbol[]>(['🍒', '🍒', '🍒']);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ won: boolean; amount: number; multiplier: number } | null>(null);
  const [showPaytable, setShowPaytable] = useState(false);

  const maxBet = state.user?.balance || 1000;
  const rtp = state.settings.slotRTP;
  const winStreak = state.streaks.currentWinStreak;
  const isNearMiss = result && !result.won && reels.filter((s, i, arr) => arr.filter(x => x === s).length >= 2).length > 0;

  const spin = async () => {
    if (!state.user) return;
    if (!placeBet(bet)) {
      toast.error('Insufficient balance');
      return;
    }

    setSpinning(true);
    setResult(null);

    const animationDuration = 1200;
    const spinInterval = 60;
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
        
        const finalReels = spinSlots(rtp);
        const { multiplier, win } = calculateSlotWin(finalReels, bet);
        
        setReels(finalReels);
        setSpinning(false);
        
        // Variable payout delay: longer for wins (build anticipation), faster for losses
        const delay = win > 0 ? 300 : 100;
        
        setTimeout(() => {
          setResult({ won: win > 0, amount: win, multiplier });

          if (win > 0) {
            addWinnings(win);
            audioManager.playWinSound(win, bet);
            toast.success(`Won ${win.toLocaleString()} credits`);
          } else {
            audioManager.playLossSound();
          }
          
          // Check for near-miss
          const hasNearMiss = finalReels.filter((s, i, arr) => arr.filter(x => x === s).length >= 2).length > 0;
          if (hasNearMiss && win === 0) {
            toast.info('So close! Try again!', { duration: 2000 });
          }
        }, delay);

        logGame({
          game: 'slots',
          bet,
          result: finalReels.join(' '),
          win,
          balanceAfter: state.user!.balance + win - bet,
          seed: rng.getSeed(),
        });
        
        // Update streak
        updateStreak(win > 0);
      }
    }, spinInterval);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-semibold">Slots</h1>
            {winStreak >= 3 && (
              <div className="flex items-center gap-1 text-primary animate-pulse-glow">
                <Flame className="h-4 w-4" />
                <span className="text-xs font-bold">{winStreak}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            RTP: {(rtp * 100).toFixed(1)}%
          </p>
        </div>

        {/* Game Card */}
        <div className="game-card space-y-4">
          {/* Reels */}
          <div className="bg-secondary rounded-md p-6">
            <div className="flex justify-center gap-3">
              {reels.map((symbol, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-16 h-20 flex items-center justify-center rounded-md bg-background border text-4xl transition-all duration-300",
                    spinning && "opacity-70 animate-reel-spin",
                    result?.won && "border-primary animate-pulse-glow premium-glow",
                    isNearMiss && !result?.won && "border-primary/50 near-miss"
                  )}
                >
                  <span className={cn(spinning && "animate-number")}>
                    {symbol}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Result */}
          {result && !spinning && (
            <ResultDisplay
              won={result.won}
              amount={result.amount}
              multiplier={result.multiplier}
            />
          )}

          {/* Bet Controls */}
          <BetControls
            bet={bet}
            onBetChange={setBet}
            maxBet={maxBet}
            disabled={spinning}
          />

          {/* Spin Button */}
          <Button
            className="w-full interactive-button"
            size="xl"
            onClick={() => {
              audioManager.playClickSound();
              spin();
            }}
            disabled={spinning || bet > (state.user?.balance || 0)}
          >
            {spinning ? 'Spinning...' : 'Spin'}
          </Button>
        </div>

        {/* Paytable */}
        <div className="game-card">
          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-sm font-medium">Paytable</span>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              showPaytable && "rotate-180"
            )} />
          </button>

          {showPaytable && (
            <div className="mt-3 pt-3 border-t border-border space-y-1.5">
              {Object.entries(SLOT_PAYTABLE)
                .sort(([, a], [, b]) => b - a)
                .map(([symbols, multiplier]) => (
                  <div
                    key={symbols}
                    className="flex items-center justify-between py-1.5 px-2 rounded bg-secondary text-sm"
                  >
                    <span className="text-xl tracking-wider">{symbols}</span>
                    <span className="mono font-medium text-primary">
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
