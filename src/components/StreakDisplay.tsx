import { useCasino } from '@/context/CasinoContext';
import { Flame, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StreakDisplay() {
  const { state } = useCasino();
  const { streaks } = state;
  
  if (streaks.currentWinStreak === 0 && streaks.currentLossStreak === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      {streaks.currentWinStreak > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/20 border border-primary/30 streak-indicator">
          <Flame className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-bold text-primary">
            {streaks.currentWinStreak} Win Streak
          </span>
        </div>
      )}
      
      {streaks.currentLossStreak >= 3 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive/20 border border-destructive/30">
          <TrendingDown className="h-4 w-4 text-destructive" />
          <span className="text-sm font-bold text-destructive">
            {streaks.currentLossStreak} Loss Streak
          </span>
        </div>
      )}
    </div>
  );
}

