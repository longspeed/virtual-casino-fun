import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

interface BetControlsProps {
  bet: number;
  onBetChange: (bet: number) => void;
  minBet?: number;
  maxBet?: number;
  disabled?: boolean;
}

export function BetControls({
  bet,
  onBetChange,
  minBet = 10,
  maxBet = 10000,
  disabled = false,
}: BetControlsProps) {
  const presetMultipliers = [0.5, 2];
  const presetAmounts = [100, 500, 1000];

  const adjustBet = (multiplier: number) => {
    const newBet = Math.round(bet * multiplier);
    onBetChange(Math.max(minBet, Math.min(maxBet, newBet)));
  };

  const setBet = (amount: number) => {
    onBetChange(Math.max(minBet, Math.min(maxBet, amount)));
  };

  return (
    <div className="space-y-4">
      {/* Main Bet Input */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => adjustBet(0.5)}
          disabled={disabled || bet <= minBet}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="relative flex-1">
          <Input
            type="number"
            value={bet}
            onChange={(e) => setBet(Number(e.target.value))}
            min={minBet}
            max={maxBet}
            disabled={disabled}
            className="text-center font-display text-lg pr-16"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            credits
          </span>
        </div>

        <Button
          variant="secondary"
          size="icon"
          onClick={() => adjustBet(2)}
          disabled={disabled || bet >= maxBet}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        {presetMultipliers.map((mult) => (
          <Button
            key={`mult-${mult}`}
            variant="ghost"
            size="sm"
            onClick={() => adjustBet(mult)}
            disabled={disabled}
            className="text-xs"
          >
            {mult < 1 ? '½' : `${mult}×`}
          </Button>
        ))}
        <span className="w-px bg-border" />
        {presetAmounts.map((amount) => (
          <Button
            key={`amount-${amount}`}
            variant="ghost"
            size="sm"
            onClick={() => setBet(amount)}
            disabled={disabled}
            className="text-xs"
          >
            {amount >= 1000 ? `${amount / 1000}K` : amount}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBet(maxBet)}
          disabled={disabled}
          className="text-xs text-gold"
        >
          MAX
        </Button>
      </div>
    </div>
  );
}
