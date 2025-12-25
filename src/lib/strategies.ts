/**
 * Betting Strategies
 * Implements common betting strategies for casino games
 */

export type StrategyType = 'martingale' | 'fibonacci' | 'dalembert' | 'labouchere' | 'none';

export interface StrategyConfig {
  type: StrategyType;
  baseBet: number;
  maxBet?: number;
  resetOnWin?: boolean;
}

export interface StrategyState {
  currentBet: number;
  sequence: number[];
  lastResult: 'win' | 'loss' | null;
  consecutiveLosses: number;
}

/**
 * Martingale Strategy: Double bet after loss, reset to base after win
 */
export function martingaleStrategy(
  config: StrategyConfig,
  state: StrategyState
): { nextBet: number; newState: StrategyState } {
  const { baseBet, maxBet } = config;
  let nextBet = baseBet;

  if (state.lastResult === 'loss') {
    nextBet = state.currentBet * 2;
    if (maxBet && nextBet > maxBet) {
      nextBet = baseBet; // Reset if exceeds max
    }
  } else if (state.lastResult === 'win') {
    nextBet = baseBet; // Reset to base after win
  }

  return {
    nextBet,
    newState: {
      currentBet: nextBet,
      sequence: state.sequence,
      lastResult: state.lastResult,
      consecutiveLosses: state.lastResult === 'loss' ? state.consecutiveLosses + 1 : 0,
    },
  };
}

/**
 * Fibonacci Strategy: Follow Fibonacci sequence after losses
 */
export function fibonacciStrategy(
  config: StrategyConfig,
  state: StrategyState
): { nextBet: number; newState: StrategyState } {
  const { baseBet, maxBet } = config;
  let sequence = [...state.sequence];
  let nextBet = baseBet;

  if (sequence.length === 0) {
    sequence = [1, 1];
  }

  if (state.lastResult === 'loss') {
    const nextIndex = Math.min(sequence.length, 10); // Limit sequence length
    if (nextIndex < sequence.length) {
      nextBet = baseBet * sequence[nextIndex];
    } else {
      // Extend Fibonacci sequence
      const next = sequence[sequence.length - 1] + sequence[sequence.length - 2];
      sequence.push(next);
      nextBet = baseBet * next;
    }
    
    if (maxBet && nextBet > maxBet) {
      nextBet = baseBet;
      sequence = [1, 1];
    }
  } else if (state.lastResult === 'win') {
    // Move back two steps in sequence
    if (sequence.length > 2) {
      sequence = sequence.slice(0, -2);
    } else {
      sequence = [1, 1];
    }
    nextBet = baseBet * (sequence[sequence.length - 1] || 1);
  }

  return {
    nextBet,
    newState: {
      currentBet: nextBet,
      sequence,
      lastResult: state.lastResult,
      consecutiveLosses: state.lastResult === 'loss' ? state.consecutiveLosses + 1 : 0,
    },
  };
}

/**
 * D'Alembert Strategy: Increase by base bet after loss, decrease after win
 */
export function dalembertStrategy(
  config: StrategyConfig,
  state: StrategyState
): { nextBet: number; newState: StrategyState } {
  const { baseBet, maxBet } = config;
  let nextBet = state.currentBet || baseBet;

  if (state.lastResult === 'loss') {
    nextBet = Math.max(baseBet, nextBet + baseBet);
    if (maxBet && nextBet > maxBet) {
      nextBet = baseBet;
    }
  } else if (state.lastResult === 'win') {
    nextBet = Math.max(baseBet, nextBet - baseBet);
  }

  return {
    nextBet,
    newState: {
      currentBet: nextBet,
      sequence: state.sequence,
      lastResult: state.lastResult,
      consecutiveLosses: state.lastResult === 'loss' ? state.consecutiveLosses + 1 : 0,
    },
  };
}

/**
 * Labouchere Strategy: Use a sequence of numbers
 */
export function labouchereStrategy(
  config: StrategyConfig,
  state: StrategyState
): { nextBet: number; newState: StrategyState } {
  const { baseBet, maxBet } = config;
  let sequence = [...state.sequence];

  // Initialize sequence if empty
  if (sequence.length === 0) {
    sequence = [1, 2, 3, 4];
  }

  let nextBet = baseBet;

  if (sequence.length === 0) {
    // Sequence complete, reset
    sequence = [1, 2, 3, 4];
    nextBet = baseBet * (sequence[0] + sequence[sequence.length - 1]);
  } else if (sequence.length === 1) {
    // Only one number left
    nextBet = baseBet * sequence[0];
  } else {
    // Bet sum of first and last
    nextBet = baseBet * (sequence[0] + sequence[sequence.length - 1]);
  }

  if (maxBet && nextBet > maxBet) {
    sequence = [1, 2, 3, 4];
    nextBet = baseBet * (sequence[0] + sequence[sequence.length - 1]);
  }

  return {
    nextBet,
    newState: {
      currentBet: nextBet,
      sequence,
      lastResult: state.lastResult,
      consecutiveLosses: state.lastResult === 'loss' ? state.consecutiveLosses + 1 : 0,
    },
  };
}

/**
 * Apply strategy based on result
 */
export function applyStrategy(
  config: StrategyConfig,
  state: StrategyState,
  result: 'win' | 'loss'
): { nextBet: number; newState: StrategyState } {
  const newState = { ...state, lastResult: result };

  switch (config.type) {
    case 'martingale':
      return martingaleStrategy(config, newState);
    case 'fibonacci':
      return fibonacciStrategy(config, newState);
    case 'dalembert':
      return dalembertStrategy(config, newState);
    case 'labouchere':
      return labouchereStrategy(config, newState);
    default:
      return {
        nextBet: config.baseBet,
        newState: { ...newState, currentBet: config.baseBet },
      };
  }
}

