import { useCasino } from '@/context/CasinoContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function DailyBonus() {
  const { state, claimDailyBonus } = useCasino();
  const { dailyBonus } = state;
  
  const today = new Date().toDateString();
  const lastClaim = dailyBonus.lastClaimDate;
  const canClaim = lastClaim !== today;
  
  const handleClaim = () => {
    if (!canClaim) {
      toast.info('You already claimed today\'s bonus!');
      return;
    }
    
    claimDailyBonus();
    toast.success(`Claimed ${dailyBonus.nextBonusAmount} credits!`);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Gift className="h-4 w-4 text-primary" />
          Daily Bonus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Consecutive Days</p>
            <p className="text-lg font-bold text-primary">{dailyBonus.consecutiveDays}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Next Bonus</p>
            <p className="text-lg font-bold mono text-primary">
              {dailyBonus.nextBonusAmount}
            </p>
          </div>
        </div>
        
        <Button
          className="w-full"
          onClick={handleClaim}
          disabled={!canClaim}
          variant={canClaim ? 'default' : 'secondary'}
        >
          <Calendar className="h-4 w-4 mr-2" />
          {canClaim ? 'Claim Bonus' : 'Already Claimed'}
        </Button>
        
        {dailyBonus.consecutiveDays > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            Keep your streak going!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

