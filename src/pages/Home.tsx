import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useCasino } from '@/context/CasinoContext';
import { DailyBonus } from '@/components/DailyBonus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Gift } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '@/lib/achievements';

const games = [
  {
    id: 'slots',
    name: 'Slots',
    description: 'Classic 3-reel slot machine',
    path: '/slots',
  },
  {
    id: 'dice',
    name: 'Dice',
    description: 'Over/under prediction game',
    path: '/dice',
  },
  {
    id: 'roulette',
    name: 'Roulette',
    description: 'European single-zero wheel',
    path: '/roulette',
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Beat the dealer to 21',
    path: '/blackjack',
  },
];

export default function Home() {
  const { state } = useCasino();
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);
  const [showComebackOffer, setShowComebackOffer] = useState(false);
  
  const balance = state.user?.balance || 0;
  const lossStreak = state.streaks.currentLossStreak;
  const totalGames = state.stats.totalGames;
  
  useEffect(() => {
    // Loss aversion mechanics
    if (balance < 1000 && balance > 0) {
      setShowLowBalanceWarning(true);
    } else {
      setShowLowBalanceWarning(false);
    }
    
    if (lossStreak >= 5) {
      setShowComebackOffer(true);
    } else {
      setShowComebackOffer(false);
    }
  }, [balance, lossStreak]);

  // Calculate progress to next achievement
  const nextAchievement = state.achievements.find(a => !a.unlocked);
  const achievementDef = nextAchievement 
    ? ACHIEVEMENTS.find(ach => ach.id === nextAchievement.achievementId)
    : null;
  const achievementProgress = nextAchievement && achievementDef
    ? (nextAchievement.progress / achievementDef.requirement) * 100
    : 100;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Balance Display */}
        <section className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
          <p className="mono text-4xl font-bold text-primary animate-count-up">
            {balance.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">virtual credits</p>
        </section>

        {/* Daily Bonus */}
        <DailyBonus />

        {/* Loss Aversion: Low Balance Warning */}
        {showLowBalanceWarning && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm mb-1">Low Balance</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Your balance is running low. Claim your daily bonus or try one more spin!
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Claim Bonus
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loss Aversion: Comeback Offer */}
        {showComebackOffer && (
          <Card className="border-primary/50 bg-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm mb-1">Lucky Spin Available!</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    After {lossStreak} losses, you've earned a guaranteed small win on your next spin!
                  </p>
                  <Button size="sm" className="w-full">
                    Take Lucky Spin
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievement Progress */}
        {nextAchievement && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Next Achievement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {achievementDef?.name || 'Next Achievement'}
                  </span>
                  <span className="font-medium">
                    {nextAchievement?.progress || 0} / {achievementDef?.requirement || 1}
                  </span>
                </div>
                <Progress value={achievementProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Games */}
        <section className="space-y-3">
          {games.map((game) => (
            <Link key={game.id} to={game.path}>
              <div className="game-card flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group">
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {game.description}
                  </p>
                </div>
                <Button variant="secondary" size="sm">
                  Play
                </Button>
              </div>
            </Link>
          ))}
        </section>

        {/* Quick Links */}
        <section className="flex justify-center gap-4 pt-4">
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Admin Panel
            </Button>
          </Link>
        </section>
      </div>
    </Layout>
  );
}
