import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { BetControls } from '@/components/BetControls';
import { useCasino } from '@/context/CasinoContext';
import { Button } from '@/components/ui/button';
import { rng } from '@/lib/rng';
import { audioManager } from '@/lib/audio';
import { Flame } from 'lucide-react';
import {
  BlackjackGame,
  Card,
  initBlackjack,
  blackjackHit,
  blackjackStand,
  blackjackDouble,
  blackjackSplit,
  dealerPlay,
  getHandValue,
  canSplit,
  canDouble,
  getSuitSymbol,
  getSuitColor,
  getBlackjackRTP,
} from '@/lib/gameLogic';

function PlayingCard({ card, small = false }: { card: Card; small?: boolean }) {
  const symbol = getSuitSymbol(card.suit);
  const color = getSuitColor(card.suit);
  
  if (!card.faceUp) {
    return (
      <div className={`${small ? 'w-12 h-16' : 'w-16 h-22'} rounded-lg bg-primary/20 border border-border flex items-center justify-center`}>
        <div className="w-8 h-10 rounded bg-primary/30" />
      </div>
    );
  }
  
  return (
    <div className={`${small ? 'w-12 h-16 text-sm' : 'w-16 h-22 text-lg'} rounded-lg bg-card border border-border flex flex-col items-center justify-between p-1.5 shadow-sm`}>
      <span className={color === 'red' ? 'text-red-500' : 'text-foreground'}>
        {card.rank}
      </span>
      <span className={`${small ? 'text-lg' : 'text-2xl'} ${color === 'red' ? 'text-red-500' : 'text-foreground'}`}>
        {symbol}
      </span>
      <span className={`rotate-180 ${color === 'red' ? 'text-red-500' : 'text-foreground'}`}>
        {card.rank}
      </span>
    </div>
  );
}

function HandDisplay({ 
  cards, 
  label, 
  value, 
  isActive = false,
  result 
}: { 
  cards: Card[]; 
  label: string;
  value: number;
  isActive?: boolean;
  result?: { outcome: 'win' | 'lose' | 'push' | 'blackjack'; payout: number };
}) {
  const getResultColor = () => {
    if (!result) return '';
    switch (result.outcome) {
      case 'win':
      case 'blackjack':
        return 'text-primary';
      case 'lose':
        return 'text-red-500';
      case 'push':
        return 'text-muted-foreground';
    }
  };

  const getResultText = () => {
    if (!result) return null;
    switch (result.outcome) {
      case 'blackjack':
        return 'BLACKJACK!';
      case 'win':
        return 'WIN';
      case 'lose':
        return 'LOSE';
      case 'push':
        return 'PUSH';
    }
  };

  return (
    <div className={`space-y-2 ${isActive ? 'ring-2 ring-primary/50 rounded-lg p-3 -m-3' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{value > 0 ? value : '?'}</span>
          {result && (
            <span className={`text-sm font-medium ${getResultColor()}`}>
              {getResultText()}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {cards.map((card, i) => (
          <div 
            key={i} 
            className="transition-all duration-300"
            style={{ 
              animationDelay: `${i * 100}ms`,
              animation: 'fade-in 0.3s ease-out forwards'
            }}
          >
            <PlayingCard card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Blackjack() {
  const { state, placeBet, addWinnings, logGame, updateStreak } = useCasino();
  const [bet, setBet] = useState(100);
  const [game, setGame] = useState<BlackjackGame | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const balance = state.user?.balance ?? 0;
  const activeHand = game?.playerHands[game.activeHandIndex];
  const winStreak = state.streaks.currentWinStreak;

  // Calculate total bet for split hands
  const totalBet = game?.playerHands.reduce((sum, h) => sum + h.bet, 0) ?? 0;

  const startGame = () => {
    if (!placeBet(bet)) return;
    setIsAnimating(true);
    
    const newGame = initBlackjack(bet);
    setGame(newGame);
    
    setTimeout(() => {
      setIsAnimating(false);
      // If player has blackjack, auto-resolve
      if (newGame.state === 'dealerTurn') {
        setTimeout(() => resolveDealerTurn(newGame), 500);
      }
    }, 500);
  };

  const handleHit = () => {
    if (!game || game.state !== 'playing' || isAnimating) return;
    setIsAnimating(true);
    
    const newGame = blackjackHit(game);
    setGame(newGame);
    
    setTimeout(() => {
      setIsAnimating(false);
      if (newGame.state === 'dealerTurn') {
        setTimeout(() => resolveDealerTurn(newGame), 300);
      }
    }, 300);
  };

  const handleStand = () => {
    if (!game || game.state !== 'playing' || isAnimating) return;
    
    const newGame = blackjackStand(game);
    setGame(newGame);
    
    if (newGame.state === 'dealerTurn') {
      setTimeout(() => resolveDealerTurn(newGame), 300);
    }
  };

  const handleDouble = () => {
    if (!game || game.state !== 'playing' || isAnimating) return;
    if (!activeHand || !canDouble(activeHand)) return;
    if (!placeBet(activeHand.bet)) return; // Need to bet additional amount
    
    setIsAnimating(true);
    const newGame = blackjackDouble(game);
    setGame(newGame);
    
    setTimeout(() => {
      setIsAnimating(false);
      if (newGame.state === 'dealerTurn') {
        setTimeout(() => resolveDealerTurn(newGame), 300);
      }
    }, 300);
  };

  const handleSplit = () => {
    if (!game || game.state !== 'playing' || isAnimating) return;
    if (!activeHand || !canSplit(activeHand)) return;
    if (!placeBet(activeHand.bet)) return; // Need to bet additional amount
    
    setIsAnimating(true);
    const newGame = blackjackSplit(game);
    setGame(newGame);
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const resolveDealerTurn = (currentGame: BlackjackGame) => {
    setIsAnimating(true);
    
    const finalGame = dealerPlay(currentGame);
    setGame(finalGame);
    
    // Calculate total payout
    const totalPayout = finalGame.results.reduce((sum, r) => sum + r.payout, 0);
    const totalBetAmount = finalGame.playerHands.reduce((sum, h) => sum + h.bet, 0);
    const netWin = totalPayout - totalBetAmount;
    
    // Variable payout delay: longer for wins, faster for losses
    const delay = netWin > 0 ? 400 : 150;
    
    setTimeout(() => {
      if (totalPayout > 0) {
        addWinnings(totalPayout);
        audioManager.playWinSound(totalPayout, totalBetAmount);
      } else {
        audioManager.playLossSound();
      }
    }, delay);
    
    // Log the game

    logGame({
      game: 'blackjack' as any,
      bet: totalBetAmount,
      result: finalGame.results.map(r => r.outcome).join(', '),
      win: netWin > 0 ? netWin : 0,
      balanceAfter: (state.user?.balance ?? 0) + totalPayout,
      seed: rng.getSeed(),
    });
    
    // Update streak
    updateStreak(netWin > 0);
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  const newGame = () => {
    setGame(null);
  };

  const dealerValue = game ? getHandValue(game.dealerHand).value : 0;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">Blackjack</h1>
              {winStreak >= 3 && (
                <div className="flex items-center gap-1 text-primary animate-pulse-glow">
                  <Flame className="h-4 w-4" />
                  <span className="text-xs font-bold">{winStreak}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Beat the dealer without going over 21
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>RTP: {(getBlackjackRTP() * 100).toFixed(1)}%</div>
            <div>Blackjack pays 6:5</div>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-card/50 border border-border rounded-xl p-6 space-y-6 min-h-[400px]">
          {!game ? (
            // Betting Phase
            <div className="space-y-6">
              <BetControls 
                bet={bet} 
                onBetChange={setBet} 
                maxBet={balance} 
                disabled={false}
              />
              <Button
                onClick={() => {
                  audioManager.playClickSound();
                  startGame();
                }}
                disabled={bet > balance || bet <= 0}
                className="w-full interactive-button"
              >
                Deal
              </Button>
            </div>
          ) : (
            // Active Game
            <div className="space-y-8">
              {/* Dealer Hand */}
              <HandDisplay 
                cards={game.dealerHand}
                label="Dealer"
                value={game.state === 'finished' ? dealerValue : (game.dealerHand[0].faceUp ? getHandValue([game.dealerHand[0]]).value : 0)}
              />

              <div className="border-t border-border" />

              {/* Player Hands */}
              <div className="space-y-4">
                {game.playerHands.map((hand, index) => (
                  <HandDisplay
                    key={index}
                    cards={hand.cards}
                    label={game.playerHands.length > 1 ? `Hand ${index + 1} (${hand.bet})` : `Your Hand (${hand.bet})`}
                    value={getHandValue(hand.cards).value}
                    isActive={game.state === 'playing' && index === game.activeHandIndex}
                    result={game.state === 'finished' ? game.results[index] : undefined}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              {game.state === 'playing' && activeHand && !isAnimating && (
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={() => {
                      audioManager.playClickSound();
                      handleHit();
                    }} 
                    variant="outline" 
                    className="flex-1 interactive-button"
                  >
                    Hit
                  </Button>
                  <Button 
                    onClick={() => {
                      audioManager.playClickSound();
                      handleStand();
                    }} 
                    variant="outline" 
                    className="flex-1 interactive-button"
                  >
                    Stand
                  </Button>
                  <Button 
                    onClick={() => {
                      audioManager.playClickSound();
                      handleDouble();
                    }} 
                    variant="outline" 
                    className="flex-1 interactive-button"
                    disabled={!canDouble(activeHand) || balance < activeHand.bet}
                  >
                    Double
                  </Button>
                  <Button 
                    onClick={() => {
                      audioManager.playClickSound();
                      handleSplit();
                    }} 
                    variant="outline" 
                    className="flex-1 interactive-button"
                    disabled={!canSplit(activeHand) || balance < activeHand.bet}
                  >
                    Split
                  </Button>
                </div>
              )}

              {/* Result */}
              {game.state === 'finished' && (
                <div className="space-y-4">
                  <div className="text-center">
                    {game.results.some(r => r.outcome === 'blackjack') && (
                      <div className="text-xl font-bold text-primary animate-pulse">BLACKJACK!</div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Total: {game.results.reduce((sum, r) => sum + r.payout, 0) > totalBet 
                        ? `+${game.results.reduce((sum, r) => sum + r.payout, 0) - totalBet}`
                        : game.results.reduce((sum, r) => sum + r.payout, 0) - totalBet
                      }
                    </div>
                  </div>
                  <Button onClick={newGame} className="w-full">
                    New Hand
                  </Button>
                </div>
              )}

              {/* Animating State */}
              {(game.state === 'dealerTurn' || isAnimating) && game.state !== 'finished' && (
                <div className="text-center text-muted-foreground animate-pulse">
                  {game.state === 'dealerTurn' ? 'Dealer playing...' : 'Dealing...'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Dealer stands on 17, hits on 16 or less</p>
          <p>• Blackjack pays 6:5</p>
          <p>• Double down on any first two cards</p>
          <p>• Split pairs into separate hands</p>
        </div>
      </div>
    </Layout>
  );
}
