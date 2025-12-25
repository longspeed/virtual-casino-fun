import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const presets = [50, 100, 500, 1000];

  const setBet = (amount: number) => {
    onBetChange(Math.max(minBet, Math.min(maxBet, amount)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setBet(Math.floor(bet / 2))}
          disabled={disabled || bet <= minBet}
          className="mono text-xs"
        >
          ½
        </Button>

        <Input
          type="number"
          value={bet}
          onChange={(e) => setBet(Number(e.target.value))}
          min={minBet}
          max={maxBet}
          disabled={disabled}
          className="text-center mono font-bold"
        />

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setBet(bet * 2)}
          disabled={disabled || bet >= maxBet}
          className="mono text-xs"
        >
          2×
        </Button>
      </div>

      <div className="flex gap-1.5">
        {presets.map((amount) => (
          <Button
            key={amount}
            variant="ghost"
            size="sm"
            onClick={() => setBet(amount)}
            disabled={disabled || amount > maxBet}
            className="flex-1 mono text-xs"
          >
            {amount >= 1000 ? `${amount / 1000}K` : amount}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBet(maxBet)}
          disabled={disabled}
          className="mono text-xs text-primary"
        >
          MAX
        </Button>
      </div>
    </div>
  );
}
