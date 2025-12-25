import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useCasino } from '@/context/CasinoContext';

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
];

export default function Home() {
  const { state } = useCasino();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Balance Display */}
        <section className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
          <p className="mono text-4xl font-bold text-primary">
            {state.user?.balance.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">virtual credits</p>
        </section>

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
