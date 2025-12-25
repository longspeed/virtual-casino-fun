import { cn } from '@/lib/utils';

interface ResultDisplayProps {
  won: boolean;
  amount: number;
  multiplier?: number;
  className?: string;
}

export function ResultDisplay({ won, amount, multiplier, className }: ResultDisplayProps) {
  if (amount === 0 && !won) {
    return (
      <div className={cn("text-center animate-fade-in", className)}>
        <p className="text-2xl font-display font-bold text-muted-foreground">
          No Win
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Try again!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("text-center animate-bounce-in", className)}>
      <p className={cn(
        "text-3xl font-display font-bold",
        won ? "text-emerald" : "text-crimson"
      )}>
        {won ? '+' : '-'}{amount.toLocaleString()}
      </p>
      {multiplier !== undefined && multiplier > 0 && (
        <p className="text-sm text-gold mt-1 font-medium">
          {multiplier}× multiplier
        </p>
      )}
    </div>
  );
}
