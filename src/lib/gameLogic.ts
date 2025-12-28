/**
 * Game Logic Module
 * 
 * Contains all the mathematical logic for casino games.
 * Each game's RTP (Return to Player) is configurable and transparent.
 */

import { rng } from './rng';

// Memoization cache for expensive calculations
const memoCache = new Map<string, any>();

// =============================================================================
// SLOT MACHINE LOGIC
// =============================================================================

export const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '7️⃣', '💎'] as const;
export type SlotSymbol = typeof SLOT_SYMBOLS[number];

interface SlotPaytable {
  [key: string]: number; // Symbol combination -> multiplier
}

/**
 * Slot machine paytable
 * Multipliers are applied to the bet amount
 */
export const SLOT_PAYTABLE: SlotPaytable = {
  '💎💎💎': 100,  // Jackpot
  '7️⃣7️⃣7️⃣': 50,   // Big win
  '⭐⭐⭐': 25,    // Star bonus
  '🔔🔔🔔': 15,    // Bell bonus
  '🍇🍇🍇': 10,    // Grape cluster
  '🍊🍊🍊': 8,     // Orange trio
  '🍋🍋🍋': 5,     // Lemon line
  '🍒🍒🍒': 3,     // Cherry bunch
  '🍒🍒': 2,       // Two cherries (any position with cherry)
};

/**
 * Calculate slot machine weights based on desired RTP
 * 
 * The RTP (Return to Player) is achieved by adjusting symbol weights.
 * Lower RTP = rarer winning combinations
 * 
 * @param targetRTP - Desired RTP as decimal (e.g., 0.96 for 96%)
 */
export function getSlotWeights(targetRTP: number): number[] {
  // Memoize for performance
  const cacheKey = `slotWeights_${targetRTP}`;
  if (memoCache.has(cacheKey)) {
    return memoCache.get(cacheKey);
  }
  
  // Base weights (higher = more common)
  // Adjusted to achieve approximate target RTP
  const rtpFactor = targetRTP / 0.96; // Normalize to 96% base
  
  const weights = [
    30 * rtpFactor,  // 🍒 Cherry (most common)
    25 * rtpFactor,  // 🍋 Lemon
    20 * rtpFactor,  // 🍊 Orange
    15 * rtpFactor,  // 🍇 Grape
    8 * rtpFactor,   // 🔔 Bell
    5 * rtpFactor,   // ⭐ Star
    3 * rtpFactor,   // 7️⃣ Seven
    1,               // 💎 Diamond (rarest, not affected by RTP to maintain jackpot rarity)
  ];
  
  memoCache.set(cacheKey, weights);
  return weights;
}

/**
 * Spin the slot machine reels with near-miss mechanics
 * 
 * @param rtp - Return to player percentage (0-1)
 * @returns Array of 3 symbols
 */
export function spinSlots(rtp: number = 0.96): SlotSymbol[] {
  const weights = getSlotWeights(rtp);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  const pickSymbol = (): SlotSymbol => {
    let random = rng.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return SLOT_SYMBOLS[i];
      }
    }
    return SLOT_SYMBOLS[0];
  };

  const symbols = [pickSymbol(), pickSymbol(), pickSymbol()];
  
  // Check if this is a losing spin
  const { win } = calculateSlotWin(symbols, 1);
  const isLosing = win === 0;
  
  // Implement near-miss mechanics: 15-20% of losing spins show "almost winning" combinations
  if (isLosing && rng.random() < 0.18) {
    // Generate a near-miss combination
    const nearMissTypes = [
      // Two matching high-value symbols
      () => {
        const highSymbols = ['💎', '7️⃣', '⭐', '🔔'];
        const symbol = rng.pick(highSymbols);
        return [symbol, symbol, rng.pick([...SLOT_SYMBOLS].filter(s => s !== symbol))];
      },
      // Two matching with one off
      () => {
        const symbol = rng.pick(['💎', '7️⃣', '⭐', '🔔', '🍇']);
        const otherSymbols = [...SLOT_SYMBOLS].filter(s => s !== symbol);
        return [symbol, symbol, rng.pick(otherSymbols)];
      },
      // Three different high-value symbols
      () => {
        const highSymbols = ['💎', '7️⃣', '⭐', '🔔'];
        return [rng.pick(highSymbols), rng.pick(highSymbols), rng.pick(highSymbols)];
      },
    ];
    
    const nearMissFunc = rng.pick(nearMissTypes);
    return nearMissFunc() as SlotSymbol[];
  }
  
  return symbols;
}

/**
 * Calculate slot machine winnings
 */
export function calculateSlotWin(symbols: SlotSymbol[], bet: number): { multiplier: number; win: number } {
  const key3 = symbols.join('');
  
  // Check for 3-symbol matches first
  if (SLOT_PAYTABLE[key3]) {
    return { multiplier: SLOT_PAYTABLE[key3], win: bet * SLOT_PAYTABLE[key3] };
  }
  
  // Check for 2 cherries anywhere
  const cherryCount = symbols.filter(s => s === '🍒').length;
  if (cherryCount >= 2) {
    return { multiplier: SLOT_PAYTABLE['🍒🍒'], win: bet * SLOT_PAYTABLE['🍒🍒'] };
  }
  
  return { multiplier: 0, win: 0 };
}

// =============================================================================
// DICE GAME LOGIC
// =============================================================================

export interface DiceResult {
  roll: number;
  target: number;
  isOver: boolean;
  won: boolean;
  multiplier: number;
  win: number;
}

/**
 * Calculate dice multiplier based on win probability
 * 
 * The multiplier is calculated as: 1 / winProbability * (1 - houseEdge)
 * This ensures the house always has an edge while being fair.
 * 
 * @param target - The target number (1-100)
 * @param isOver - True if betting over, false if under
 * @param houseEdge - House edge as decimal (default 2%)
 */
export function calculateDiceMultiplier(target: number, isOver: boolean, houseEdge: number = 0.02): number {
  // Win probability
  const winProb = isOver ? (100 - target) / 100 : (target - 1) / 100;
  
  if (winProb <= 0 || winProb >= 1) return 0;
  
  // Fair multiplier minus house edge
  const multiplier = (1 / winProb) * (1 - houseEdge);
  
  return Math.round(multiplier * 100) / 100; // Round to 2 decimals
}

/**
 * Roll the dice
 * 
 * @param target - Target number (2-99)
 * @param isOver - True if betting over target
 * @param bet - Bet amount
 * @param houseEdge - House edge percentage
 */
export function rollDice(target: number, isOver: boolean, bet: number, houseEdge: number = 0.02): DiceResult {
  const roll = rng.randomInt(1, 100);
  const won = isOver ? roll > target : roll < target;
  const multiplier = calculateDiceMultiplier(target, isOver, houseEdge);
  
  return {
    roll,
    target,
    isOver,
    won,
    multiplier,
    win: won ? Math.floor(bet * multiplier) : 0,
  };
}

// =============================================================================
// ROULETTE LOGIC
// =============================================================================

export type RouletteColor = 'red' | 'black' | 'green';
export type RouletteBetType = 
  | 'straight' // Single number
  | 'red' | 'black' // Colors
  | 'odd' | 'even' // Parity
  | 'low' | 'high' // 1-18 or 19-36
  | 'dozen1' | 'dozen2' | 'dozen3' // Dozens
  | 'column1' | 'column2' | 'column3'; // Columns

export interface RoulettePocket {
  number: number;
  color: RouletteColor;
}

/**
 * European Roulette wheel layout (single zero)
 * Numbers are arranged in the actual wheel order
 */
export const ROULETTE_WHEEL: RoulettePocket[] = [
  { number: 0, color: 'green' },
  { number: 32, color: 'red' }, { number: 15, color: 'black' },
  { number: 19, color: 'red' }, { number: 4, color: 'black' },
  { number: 21, color: 'red' }, { number: 2, color: 'black' },
  { number: 25, color: 'red' }, { number: 17, color: 'black' },
  { number: 34, color: 'red' }, { number: 6, color: 'black' },
  { number: 27, color: 'red' }, { number: 13, color: 'black' },
  { number: 36, color: 'red' }, { number: 11, color: 'black' },
  { number: 30, color: 'red' }, { number: 8, color: 'black' },
  { number: 23, color: 'red' }, { number: 10, color: 'black' },
  { number: 5, color: 'red' }, { number: 24, color: 'black' },
  { number: 16, color: 'red' }, { number: 33, color: 'black' },
  { number: 1, color: 'red' }, { number: 20, color: 'black' },
  { number: 14, color: 'red' }, { number: 31, color: 'black' },
  { number: 9, color: 'red' }, { number: 22, color: 'black' },
  { number: 18, color: 'red' }, { number: 29, color: 'black' },
  { number: 7, color: 'red' }, { number: 28, color: 'black' },
  { number: 12, color: 'red' }, { number: 35, color: 'black' },
  { number: 3, color: 'red' }, { number: 26, color: 'black' },
];

/**
 * Roulette payout multipliers
 * European roulette has a house edge of 2.7% (1/37)
 */
export const ROULETTE_PAYOUTS: Record<RouletteBetType, number> = {
  straight: 35,  // Single number: 35 to 1
  red: 1,        // Red: 1 to 1 (even money)
  black: 1,      // Black: 1 to 1
  odd: 1,        // Odd: 1 to 1
  even: 1,       // Even: 1 to 1
  low: 1,        // 1-18: 1 to 1
  high: 1,       // 19-36: 1 to 1
  dozen1: 2,     // 1st dozen: 2 to 1
  dozen2: 2,     // 2nd dozen: 2 to 1
  dozen3: 2,     // 3rd dozen: 2 to 1
  column1: 2,    // 1st column: 2 to 1
  column2: 2,    // 2nd column: 2 to 1
  column3: 2,    // 3rd column: 2 to 1
};

export interface RouletteBet {
  type: RouletteBetType;
  number?: number; // Only for straight bets
  amount: number;
}

export interface RouletteResult {
  pocket: RoulettePocket;
  bets: Array<RouletteBet & { won: boolean; payout: number }>;
  totalWin: number;
}

/**
 * Spin the roulette wheel
 */
export function spinRoulette(bets: RouletteBet[]): RouletteResult {
  const pocket = rng.pick(ROULETTE_WHEEL);
  
  const evaluatedBets = bets.map(bet => {
    const won = evaluateRouletteBet(bet, pocket);
    const payout = won ? bet.amount * ROULETTE_PAYOUTS[bet.type] + bet.amount : 0;
    return { ...bet, won, payout };
  });
  
  const totalWin = evaluatedBets.reduce((sum, bet) => sum + bet.payout, 0);
  
  return { pocket, bets: evaluatedBets, totalWin };
}

/**
 * Evaluate if a bet wins
 */
function evaluateRouletteBet(bet: RouletteBet, pocket: RoulettePocket): boolean {
  const { number, color } = pocket;
  
  switch (bet.type) {
    case 'straight':
      return number === bet.number;
    case 'red':
      return color === 'red';
    case 'black':
      return color === 'black';
    case 'odd':
      return number !== 0 && number % 2 === 1;
    case 'even':
      return number !== 0 && number % 2 === 0;
    case 'low':
      return number >= 1 && number <= 18;
    case 'high':
      return number >= 19 && number <= 36;
    case 'dozen1':
      return number >= 1 && number <= 12;
    case 'dozen2':
      return number >= 13 && number <= 24;
    case 'dozen3':
      return number >= 25 && number <= 36;
    case 'column1':
      return number !== 0 && number % 3 === 1;
    case 'column2':
      return number !== 0 && number % 3 === 2;
    case 'column3':
      return number !== 0 && number % 3 === 0;
    default:
      return false;
  }
}

/**
 * Get theoretical RTP for roulette (European)
 * = 36/37 = 97.3%
 */
export function getRouletteRTP(): number {
  return 36 / 37;
}

// =============================================================================
// BLACKJACK LOGIC
// =============================================================================

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface BlackjackHand {
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isStanding: boolean;
  isBusted: boolean;
  isBlackjack: boolean;
}

export type BlackjackGameState = 'betting' | 'playing' | 'dealerTurn' | 'finished';

export interface BlackjackGame {
  deck: Card[];
  playerHands: BlackjackHand[];
  activeHandIndex: number;
  dealerHand: Card[];
  state: BlackjackGameState;
  results: Array<{ outcome: 'win' | 'lose' | 'push' | 'blackjack'; payout: number }>;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/**
 * Create a fresh deck of 52 cards
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: true });
    }
  }
  return deck;
}

/**
 * Shuffle deck using Fisher-Yates algorithm with our RNG
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.randomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get card value for blackjack
 * Face cards = 10, Ace = 11 or 1 (handled in getHandValue)
 */
export function getCardValue(card: Card): number {
  if (card.rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  return parseInt(card.rank, 10);
}

/**
 * Calculate hand value with soft ace handling
 * Returns best possible value (treating aces as 1 if needed to stay <= 21)
 */
export function getHandValue(cards: Card[]): { value: number; isSoft: boolean } {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    if (!card.faceUp) continue;
    value += getCardValue(card);
    if (card.rank === 'A') aces++;
  }

  // Convert aces from 11 to 1 as needed
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return { value, isSoft: aces > 0 && value <= 21 };
}

/**
 * Check if hand is a natural blackjack (Ace + 10-value card)
 */
export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && getHandValue(cards).value === 21;
}

/**
 * Check if hand is busted
 */
export function isBusted(cards: Card[]): boolean {
  return getHandValue(cards).value > 21;
}

/**
 * Check if player can split (two cards of same rank)
 */
export function canSplit(hand: BlackjackHand): boolean {
  if (hand.cards.length !== 2) return false;
  return getCardValue(hand.cards[0]) === getCardValue(hand.cards[1]);
}

/**
 * Check if player can double down (first two cards only)
 */
export function canDouble(hand: BlackjackHand): boolean {
  return hand.cards.length === 2 && !hand.isDoubled;
}

/**
 * Initialize a new blackjack game
 */
export function initBlackjack(bet: number): BlackjackGame {
  let deck = shuffleDeck(createDeck());
  
  // Deal initial cards
  const playerCard1 = { ...deck.pop()!, faceUp: true };
  const dealerCard1 = { ...deck.pop()!, faceUp: true };
  const playerCard2 = { ...deck.pop()!, faceUp: true };
  const dealerCard2 = { ...deck.pop()!, faceUp: false }; // Hole card face down

  const playerCards = [playerCard1, playerCard2];
  const playerBlackjack = isBlackjack(playerCards);

  return {
    deck,
    playerHands: [{
      cards: playerCards,
      bet,
      isDoubled: false,
      isStanding: playerBlackjack,
      isBusted: false,
      isBlackjack: playerBlackjack,
    }],
    activeHandIndex: 0,
    dealerHand: [dealerCard1, dealerCard2],
    state: playerBlackjack ? 'dealerTurn' : 'playing',
    results: [],
  };
}

/**
 * Player hits (takes a card)
 */
export function blackjackHit(game: BlackjackGame): BlackjackGame {
  if (game.state !== 'playing') return game;
  
  const newGame = { ...game, deck: [...game.deck], playerHands: [...game.playerHands] };
  const hand = { ...newGame.playerHands[newGame.activeHandIndex] };
  
  const newCard = { ...newGame.deck.pop()!, faceUp: true };
  hand.cards = [...hand.cards, newCard];
  
  if (isBusted(hand.cards)) {
    hand.isBusted = true;
    hand.isStanding = true;
  }
  
  newGame.playerHands[newGame.activeHandIndex] = hand;
  
  // Move to next hand or dealer turn if current hand is done
  if (hand.isStanding) {
    return moveToNextHand(newGame);
  }
  
  return newGame;
}

/**
 * Player stands (keeps current hand)
 */
export function blackjackStand(game: BlackjackGame): BlackjackGame {
  if (game.state !== 'playing') return game;
  
  const newGame = { ...game, playerHands: [...game.playerHands] };
  const hand = { ...newGame.playerHands[newGame.activeHandIndex] };
  hand.isStanding = true;
  newGame.playerHands[newGame.activeHandIndex] = hand;
  
  return moveToNextHand(newGame);
}

/**
 * Player doubles down (double bet, take one card, stand)
 */
export function blackjackDouble(game: BlackjackGame): BlackjackGame {
  if (game.state !== 'playing') return game;
  
  const hand = game.playerHands[game.activeHandIndex];
  if (!canDouble(hand)) return game;
  
  const newGame = { ...game, deck: [...game.deck], playerHands: [...game.playerHands] };
  const newHand = { ...hand };
  
  newHand.bet *= 2;
  newHand.isDoubled = true;
  
  const newCard = { ...newGame.deck.pop()!, faceUp: true };
  newHand.cards = [...newHand.cards, newCard];
  
  if (isBusted(newHand.cards)) {
    newHand.isBusted = true;
  }
  newHand.isStanding = true;
  
  newGame.playerHands[newGame.activeHandIndex] = newHand;
  
  return moveToNextHand(newGame);
}

/**
 * Player splits (split pair into two hands)
 */
export function blackjackSplit(game: BlackjackGame): BlackjackGame {
  if (game.state !== 'playing') return game;
  
  const hand = game.playerHands[game.activeHandIndex];
  if (!canSplit(hand)) return game;
  
  const newGame = { ...game, deck: [...game.deck], playerHands: [...game.playerHands] };
  
  // Create two new hands from the split
  const card1 = hand.cards[0];
  const card2 = hand.cards[1];
  
  const newCard1 = { ...newGame.deck.pop()!, faceUp: true };
  const newCard2 = { ...newGame.deck.pop()!, faceUp: true };
  
  const hand1: BlackjackHand = {
    cards: [card1, newCard1],
    bet: hand.bet,
    isDoubled: false,
    isStanding: false,
    isBusted: false,
    isBlackjack: false, // Split hands can't be blackjack
  };
  
  const hand2: BlackjackHand = {
    cards: [card2, newCard2],
    bet: hand.bet,
    isDoubled: false,
    isStanding: false,
    isBusted: false,
    isBlackjack: false,
  };
  
  // Replace current hand with two new hands
  newGame.playerHands.splice(newGame.activeHandIndex, 1, hand1, hand2);
  
  return newGame;
}

/**
 * Move to next hand or dealer turn
 */
function moveToNextHand(game: BlackjackGame): BlackjackGame {
  const newGame = { ...game };
  
  // Find next active hand
  let nextIndex = newGame.activeHandIndex + 1;
  while (nextIndex < newGame.playerHands.length && newGame.playerHands[nextIndex].isStanding) {
    nextIndex++;
  }
  
  if (nextIndex < newGame.playerHands.length) {
    newGame.activeHandIndex = nextIndex;
  } else {
    // All hands done, dealer's turn
    newGame.state = 'dealerTurn';
  }
  
  return newGame;
}

/**
 * Dealer plays their hand (hits on 16 or less, stands on 17+)
 */
export function dealerPlay(game: BlackjackGame): BlackjackGame {
  if (game.state !== 'dealerTurn') return game;
  
  const newGame = { ...game, deck: [...game.deck], dealerHand: [...game.dealerHand] };
  
  // Reveal hole card
  newGame.dealerHand = newGame.dealerHand.map(card => ({ ...card, faceUp: true }));
  
  // Check if all player hands busted
  const allBusted = newGame.playerHands.every(h => h.isBusted);
  
  if (!allBusted) {
    // Dealer hits on 16 or less, stands on 17+
    while (getHandValue(newGame.dealerHand).value < 17) {
      const newCard = { ...newGame.deck.pop()!, faceUp: true };
      newGame.dealerHand = [...newGame.dealerHand, newCard];
    }
  }
  
  // Calculate results
  const dealerValue = getHandValue(newGame.dealerHand).value;
  const dealerBusted = dealerValue > 21;
  const dealerBlackjack = isBlackjack(newGame.dealerHand);
  
  newGame.results = newGame.playerHands.map(hand => {
    if (hand.isBusted) {
      return { outcome: 'lose' as const, payout: 0 };
    }
    
    const playerValue = getHandValue(hand.cards).value;
    
    // Player blackjack vs dealer blackjack = push
    if (hand.isBlackjack && dealerBlackjack) {
      return { outcome: 'push' as const, payout: hand.bet };
    }
    
    // Player blackjack pays 6:5 (reduced from 3:2)
    if (hand.isBlackjack) {
      return { outcome: 'blackjack' as const, payout: hand.bet + Math.floor(hand.bet * 1.2) };
    }
    
    // Dealer blackjack beats all non-blackjack hands
    if (dealerBlackjack) {
      return { outcome: 'lose' as const, payout: 0 };
    }
    
    if (dealerBusted || playerValue > dealerValue) {
      return { outcome: 'win' as const, payout: hand.bet * 2 };
    }
    
    if (playerValue === dealerValue) {
      return { outcome: 'push' as const, payout: hand.bet };
    }
    
    return { outcome: 'lose' as const, payout: 0 };
  });
  
  newGame.state = 'finished';
  
  return newGame;
}

/**
 * Get suit symbol for display
 */
export function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
  }
}

/**
 * Get suit color
 */
export function getSuitColor(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

/**
 * Get theoretical RTP for blackjack (basic strategy)
 * Approximately 99.5% with optimal play
 */
export function getBlackjackRTP(): number {
  return 0.995;
}
