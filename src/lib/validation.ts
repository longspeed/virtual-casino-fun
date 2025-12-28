/**
 * Input validation and sanitization utilities
 */

// Bounds constants
export const BOUNDS = {
  MIN_BET: 10,
  MAX_BET: 1000000,
  MIN_BALANCE: 0,
  MAX_BALANCE: 100000000,
  MIN_DEFAULT_BALANCE: 100,
  MAX_DEFAULT_BALANCE: 10000000,
  MIN_SLOT_RTP: 0.8,
  MAX_SLOT_RTP: 0.99,
  MIN_DICE_HOUSE_EDGE: 0,
  MAX_DICE_HOUSE_EDGE: 0.1,
  MIN_RNG_SEED: 0,
  MAX_RNG_SEED: Number.MAX_SAFE_INTEGER,
} as const;

/**
 * Sanitize and validate a number input
 */
export function sanitizeNumber(
  value: unknown,
  min: number,
  max: number,
  defaultValue: number
): number {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return defaultValue;
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }

  return Math.max(min, Math.min(max, Math.round(num)));
}

/**
 * Validate and sanitize bet amount
 */
export function validateBetAmount(amount: unknown, maxBet: number): number {
  return sanitizeNumber(amount, BOUNDS.MIN_BET, Math.min(maxBet, BOUNDS.MAX_BET), BOUNDS.MIN_BET);
}

/**
 * Validate and sanitize balance
 */
export function validateBalance(balance: unknown): number {
  return sanitizeNumber(balance, BOUNDS.MIN_BALANCE, BOUNDS.MAX_BALANCE, BOUNDS.MIN_BALANCE);
}

/**
 * Validate and sanitize default balance setting
 */
export function validateDefaultBalance(balance: unknown): number {
  return sanitizeNumber(
    balance,
    BOUNDS.MIN_DEFAULT_BALANCE,
    BOUNDS.MAX_DEFAULT_BALANCE,
    10000
  );
}

/**
 * Validate and sanitize slot RTP (0-1 range)
 */
export function validateSlotRTP(rtp: unknown): number {
  const num = sanitizeNumber(rtp, BOUNDS.MIN_SLOT_RTP, BOUNDS.MAX_SLOT_RTP, 0.93);
  return Math.round(num * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Validate and sanitize dice house edge (0-1 range)
 */
export function validateDiceHouseEdge(edge: unknown): number {
  const num = sanitizeNumber(edge, BOUNDS.MIN_DICE_HOUSE_EDGE, BOUNDS.MAX_DICE_HOUSE_EDGE, 0.04);
  return Math.round(num * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Validate and sanitize RNG seed
 */
export function validateRNGSeed(seed: unknown): number | null {
  if (seed === null || seed === undefined || seed === '') {
    return null;
  }

  const num = typeof seed === 'string' ? parseInt(seed, 10) : seed;

  if (isNaN(num) || !isFinite(num) || num < BOUNDS.MIN_RNG_SEED) {
    return null;
  }

  // Ensure it's a safe integer
  if (num > Number.MAX_SAFE_INTEGER) {
    return null;
  }

  return Math.floor(num);
}

/**
 * Validate string input (sanitize for XSS prevention)
 */
export function sanitizeString(input: unknown, maxLength: number = 100): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove any potentially dangerous characters
  let sanitized = input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .slice(0, maxLength);

  return sanitized;
}

