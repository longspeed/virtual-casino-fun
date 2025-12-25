import { useCasino } from '@/context/CasinoContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Users } from 'lucide-react';

export default function Leaderboard() {
  const { state } = useCasino();

  // Generate mock leaderboard data for demonstration
  const generateLeaderboard = () => {
    const players = [
      { username: 'HighRoller99', balance: 125000, wins: 342, streak: 8 },
      { username: 'LuckyDice', balance: 98000, wins: 289, streak: 5 },
      { username: 'SlotMaster', balance: 87500, wins: 267, streak: 12 },
      { username: 'BlackjackPro', balance: 72000, wins: 198, streak: 3 },
      { username: state.user?.username || 'You', balance: state.user?.balance || 0, wins: state.stats.totalWins, streak: state.streaks.currentWinStreak },
      { username: 'RouletteKing', balance: 65000, wins: 234, streak: 6 },
      { username: 'CasinoVeteran', balance: 58000, wins: 412, streak: 2 },
      { username: 'BigWinner', balance: 52000, wins: 156, streak: 4 },
    ];

    return players.sort((a, b) => b.balance - a.balance);
  };

  const leaderboard = generateLeaderboard();
  const userRank = leaderboard.findIndex(p => p.username === state.user?.username) + 1;

  // Recent big wins ticker (mock data)
  const recentWins = [
    { username: 'HighRoller99', game: 'Slots', amount: 50000, time: '2m ago' },
    { username: 'LuckyDice', game: 'Dice', amount: 25000, time: '5m ago' },
    { username: 'SlotMaster', game: 'Slots', amount: 15000, time: '8m ago' },
    { username: 'BlackjackPro', game: 'Blackjack', amount: 12000, time: '12m ago' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Top players and recent big wins
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Top Players */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((player, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      player.username === state.user?.username
                        ? 'bg-primary/10 border-primary'
                        : 'bg-secondary border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {player.username}
                          {player.username === state.user?.username && (
                            <span className="ml-2 text-xs text-primary">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {player.wins} wins • {player.streak} streak
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="mono font-bold text-primary">
                        {player.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Big Wins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentWins.map((win, index) => (
                  <div
                    key={index}
                    className="p-2 rounded bg-secondary border border-border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{win.username}</p>
                      <p className="text-xs text-muted-foreground">{win.time}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground capitalize">
                        {win.game}
                      </p>
                      <p className="mono text-sm font-bold text-primary">
                        +{win.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Rank */}
        {state.user && userRank > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="text-3xl font-bold text-primary mt-2">#{userRank}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Keep playing to climb the leaderboard!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

