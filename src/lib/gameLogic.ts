/**
 * Game Logic Module
 * 
 * Contains all the mathematical logic for casino games.
 * Each game's RTP (Return to Player) is configurable and transparent.
 */

import { rng } from './rng';

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
  // Base weights (higher = more common)
  // Adjusted to achieve approximate target RTP
  const rtpFactor = targetRTP / 0.96; // Normalize to 96% base
  
  return [
    30 * rtpFactor,  // 🍒 Cherry (most common)
    25 * rtpFactor,  // 🍋 Lemon
    20 * rtpFactor,  // 🍊 Orange
    15 * rtpFactor,  // 🍇 Grape
    8 * rtpFactor,   // 🔔 Bell
    5 * rtpFactor,   // ⭐ Star
    3 * rtpFactor,   // 7️⃣ Seven
    1,               // 💎 Diamond (rarest, not affected by RTP to maintain jackpot rarity)
  ];
}

/**
 * Spin the slot machine reels
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

  return [pickSymbol(), pickSymbol(), pickSymbol()];
}

/**
 * Calculate slot machine winnings
 */
export function calculateSlotWin(symbols: SlotSymbol[], bet: number): { multiplier: number; win: number } {
  const key3 = symbols.join('');
  const key2 = symbols.slice(0, 2).join('');
  
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
