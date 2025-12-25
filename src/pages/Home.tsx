import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useCasino } from '@/context/CasinoContext';
import { Coins, Dices, CircleDot, TrendingUp, Shield, Eye } from 'lucide-react';

const games = [
  {
    id: 'slots',
    name: 'Slot Machine',
    description: 'Match symbols to win big! Adjustable RTP for testing.',
    icon: Coins,
    path: '/slots',
    color: 'from-gold to-gold-dim',
  },
  {
    id: 'dice',
    name: 'Dice Game',
    description: 'Predict over/under with dynamic multipliers.',
    icon: Dices,
    path: '/dice',
    color: 'from-emerald to-emerald-glow',
  },
  {
    id: 'roulette',
    name: 'European Roulette',
    description: 'Classic single-zero wheel with all standard bets.',
    icon: CircleDot,
    path: '/roulette',
    color: 'from-crimson to-crimson-glow',
  },
];

const features = [
  {
    icon: Shield,
    title: 'No Real Money',
    description: 'Pure simulation with virtual test credits only.',
  },
  {
    icon: Eye,
    title: 'Transparent RTP',
    description: 'All game odds are displayed openly for testing.',
  },
  {
    icon: TrendingUp,
    title: 'Auditable RNG',
    description: 'Seeded random number generator for reproducibility.',
  },
];

export default function Home() {
  const { state } = useCasino();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Welcome Section */}
        <section className="text-center animate-slide-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Welcome, <span className="gold-text">{state.user?.username}</span>!
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Your virtual testing balance
          </p>
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/30 casino-glow">
            <Coins className="h-8 w-8 text-gold" />
            <span className="font-display text-4xl font-bold text-gold">
              {state.user?.balance.toLocaleString()}
            </span>
            <span className="text-muted-foreground">credits</span>
          </div>
        </section>

        {/* Games Grid */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-center mb-6">
            Choose Your Game
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {games.map((game, index) => (
              <Link
                key={game.id}
                to={game.path}
                className="group casino-card hover:border-gold/50 transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${game.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <game.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  {game.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {game.description}
                </p>
                <Button variant="casino" className="w-full group-hover:border-gold">
                  Play Now
                </Button>
              </Link>
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-center mb-6">
            Testing Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="text-center p-6">
                <div className="inline-flex p-3 rounded-xl bg-secondary mb-4">
                  <feature.icon className="h-6 w-6 text-gold" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Admin Link */}
        <section className="text-center">
          <Link to="/admin">
            <Button variant="ghost" className="text-muted-foreground">
              Access Admin Panel →
            </Button>
          </Link>
        </section>
      </div>
    </Layout>
  );
}
