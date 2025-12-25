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
      <div className={cn("text-center py-2", className)}>
        <p className="text-lg text-muted-foreground">No win</p>
      </div>
    );
  }

  return (
    <div className={cn("text-center py-2 animate-result", className)}>
      <p className={cn(
        "mono text-2xl font-bold",
        won ? "text-win" : "text-loss"
      )}>
        {won ? '+' : '-'}{amount.toLocaleString()}
      </p>
      {multiplier !== undefined && multiplier > 0 && (
        <p className="text-sm text-muted-foreground mt-0.5">
          {multiplier}× multiplier
        </p>
      )}
    </div>
  );
}
