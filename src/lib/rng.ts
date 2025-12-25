/**
 * Seeded Random Number Generator (Mulberry32)
 * 
 * This RNG uses the Mulberry32 algorithm, which is a simple but effective
 * 32-bit PRNG. It's deterministic when seeded, making it perfect for
 * auditable gambling simulations.
 * 
 * Mathematical properties:
 * - Period: 2^32
 * - Passes: BigCrush statistical tests
 * - Speed: Very fast (single 32-bit multiply)
 */

export class SeededRNG {
  private seed: number;
  private initialSeed: number;

  constructor(seed?: number) {
    this.initialSeed = seed ?? Date.now();
    this.seed = this.initialSeed;
  }

  /**
   * Generates a random number between 0 and 1 (exclusive of 1)
   * Uses Mulberry32 algorithm
   */
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates a random integer between min and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns true with the given probability (0-1)
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Picks a random element from an array
   */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Gets the current seed for auditing purposes
   */
  getSeed(): number {
    return this.initialSeed;
  }

  /**
   * Resets the RNG to its initial seed
   */
  reset(): void {
    this.seed = this.initialSeed;
  }

  /**
   * Sets a new seed
   */
  setSeed(seed: number): void {
    this.initialSeed = seed;
    this.seed = seed;
  }
}

// Global RNG instance with optional seeding
let globalRNG = new SeededRNG();

export const rng = {
  /**
   * Get a random number between 0 and 1
   */
  random: () => globalRNG.next(),

  /**
   * Get a random integer between min and max (inclusive)
   */
  randomInt: (min: number, max: number) => globalRNG.nextInt(min, max),

  /**
   * Returns true with given probability
   */
  chance: (probability: number) => globalRNG.chance(probability),

  /**
   * Pick random element from array
   */
  pick: <T>(array: T[]) => globalRNG.pick(array),

  /**
   * Set the global seed (useful for testing reproducibility)
   */
  setSeed: (seed: number) => {
    globalRNG = new SeededRNG(seed);
  },

  /**
   * Get current seed for audit trail
   */
  getSeed: () => globalRNG.getSeed(),

  /**
   * Generate a new random seed
   */
  newSeed: () => {
    const seed = Date.now() ^ (Math.random() * 0x100000000);
    globalRNG = new SeededRNG(seed);
    return seed;
  },
};
