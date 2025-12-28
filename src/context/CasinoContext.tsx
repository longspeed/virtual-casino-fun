import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { rng } from '@/lib/rng';
import { AchievementProgress, checkAchievements, ACHIEVEMENTS } from '@/lib/achievements';
import {
  validateBalance,
  validateDefaultBalance,
  validateSlotRTP,
  validateDiceHouseEdge,
  validateRNGSeed,
  validateBetAmount,
  BOUNDS,
} from '@/lib/validation';
import { logger } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface User {
  id: string;
  username: string;
  balance: number;
  createdAt: Date;
}

export interface GameLog {
  id: string;
  userId: string;
  game: 'slots' | 'dice' | 'roulette' | 'blackjack';
  bet: number;
  result: string;
  win: number;
  balanceAfter: number;
  timestamp: Date;
  seed: number;
}

export interface CasinoSettings {
  defaultBalance: number;
  slotRTP: number;
  diceHouseEdge: number;
  rngSeed: number | null;
}

export interface StreakData {
  currentWinStreak: number;
  currentLossStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
}

export interface DailyBonus {
  lastClaimDate: string | null;
  consecutiveDays: number;
  nextBonusAmount: number;
}

interface CasinoState {
  user: User | null;
  settings: CasinoSettings;
  gameLogs: GameLog[];
  isAdmin: boolean;
  streaks: StreakData;
  achievements: AchievementProgress[];
  dailyBonus: DailyBonus;
  stats: {
    totalGames: number;
    totalWins: number;
    biggestWin: number;
    biggestBet: number;
    gameWins: Record<string, number>;
    specialEvents: Record<string, number>;
  };
}

type CasinoAction =
  | { type: 'LOGIN'; payload: { username: string } }
  | { type: 'LOGIN_GUEST' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_BALANCE'; payload: number }
  | { type: 'ADD_GAME_LOG'; payload: Omit<GameLog, 'id' | 'timestamp'> }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<CasinoSettings> }
  | { type: 'RESET_BALANCE' }
  | { type: 'CLEAR_LOGS' }
  | { type: 'TOGGLE_ADMIN' }
  | { type: 'UPDATE_STREAK'; payload: { won: boolean } }
  | { type: 'UPDATE_ACHIEVEMENTS'; payload: AchievementProgress[] }
  | { type: 'CLAIM_DAILY_BONUS'; payload: number }
  | { type: 'UPDATE_STATS'; payload: Partial<CasinoState['stats']> };

// =============================================================================
// INITIAL STATE
// =============================================================================

const DEFAULT_SETTINGS: CasinoSettings = {
  defaultBalance: 10000,
  slotRTP: 0.93, // 93% RTP (7% house edge)
  diceHouseEdge: 0.04, // 4% house edge
  rngSeed: null, // null = use random seed
};

const loadState = (): CasinoState => {
  try {
    const saved = localStorage.getItem('casinoState');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Validate and sanitize loaded state to prevent manipulation
      const validatedState: CasinoState = {
        user: parsed.user
          ? {
              id: typeof parsed.user.id === 'string' ? parsed.user.id : crypto.randomUUID(),
              username: typeof parsed.user.username === 'string' 
                ? parsed.user.username.slice(0, 50) 
                : 'Guest',
              balance: validateBalance(parsed.user.balance),
              createdAt: parsed.user.createdAt 
                ? new Date(parsed.user.createdAt) 
                : new Date(),
            }
          : null,
        settings: {
          defaultBalance: validateDefaultBalance(parsed.settings?.defaultBalance),
          slotRTP: validateSlotRTP(parsed.settings?.slotRTP),
          diceHouseEdge: validateDiceHouseEdge(parsed.settings?.diceHouseEdge),
          rngSeed: validateRNGSeed(parsed.settings?.rngSeed),
        },
        gameLogs: Array.isArray(parsed.gameLogs)
          ? parsed.gameLogs
              .slice(0, 1000) // Limit to 1000 logs
              .map((log: any) => ({
                id: typeof log.id === 'string' ? log.id : crypto.randomUUID(),
                userId: typeof log.userId === 'string' ? log.userId : '',
                game: ['slots', 'dice', 'roulette', 'blackjack'].includes(log.game)
                  ? log.game
                  : 'slots',
                bet: validateBetAmount(log.bet, BOUNDS.MAX_BET),
                result: typeof log.result === 'string' ? log.result.slice(0, 200) : '',
                win: validateBalance(log.win),
                balanceAfter: validateBalance(log.balanceAfter),
                timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
                seed: typeof log.seed === 'number' ? log.seed : 0,
              }))
          : [],
        isAdmin: typeof parsed.isAdmin === 'boolean' ? parsed.isAdmin : false,
        streaks: {
          currentWinStreak: Math.max(0, Math.min(10000, Number(parsed.streaks?.currentWinStreak) || 0)),
          currentLossStreak: Math.max(0, Math.min(10000, Number(parsed.streaks?.currentLossStreak) || 0)),
          longestWinStreak: Math.max(0, Math.min(10000, Number(parsed.streaks?.longestWinStreak) || 0)),
          longestLossStreak: Math.max(0, Math.min(10000, Number(parsed.streaks?.longestLossStreak) || 0)),
        },
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements.slice(0, 100) : [],
        dailyBonus: {
          lastClaimDate: typeof parsed.dailyBonus?.lastClaimDate === 'string' 
            ? parsed.dailyBonus.lastClaimDate 
            : null,
          consecutiveDays: Math.max(0, Math.min(365, Number(parsed.dailyBonus?.consecutiveDays) || 0)),
          nextBonusAmount: Math.max(0, Math.min(1000000, Number(parsed.dailyBonus?.nextBonusAmount) || 100)),
        },
        stats: {
          totalGames: Math.max(0, Number(parsed.stats?.totalGames) || 0),
          totalWins: Math.max(0, Number(parsed.stats?.totalWins) || 0),
          biggestWin: Math.max(0, Math.min(BOUNDS.MAX_BALANCE, Number(parsed.stats?.biggestWin) || 0)),
          biggestBet: Math.max(0, Math.min(BOUNDS.MAX_BET, Number(parsed.stats?.biggestBet) || 0)),
          gameWins: typeof parsed.stats?.gameWins === 'object' && parsed.stats.gameWins !== null
            ? parsed.stats.gameWins
            : {},
          specialEvents: typeof parsed.stats?.specialEvents === 'object' && parsed.stats.specialEvents !== null
            ? parsed.stats.specialEvents
            : {},
        },
      };
      
      return validatedState;
    }
  } catch (e) {
    logger.error('Failed to load casino state:', e);
  }
  return {
    user: null,
    settings: DEFAULT_SETTINGS,
    gameLogs: [],
    isAdmin: false,
    streaks: {
      currentWinStreak: 0,
      currentLossStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
    },
    achievements: [],
    dailyBonus: {
      lastClaimDate: null,
      consecutiveDays: 0,
      nextBonusAmount: 100,
    },
    stats: {
      totalGames: 0,
      totalWins: 0,
      biggestWin: 0,
      biggestBet: 0,
      gameWins: {},
      specialEvents: {},
    },
  };
};

// =============================================================================
// REDUCER
// =============================================================================

function casinoReducer(state: CasinoState, action: CasinoAction): CasinoState {
  let newState: CasinoState;

  switch (action.type) {
    case 'LOGIN':
      // Sanitize username
      const sanitizedUsername = typeof action.payload.username === 'string'
        ? action.payload.username.slice(0, 50).trim() || 'Guest'
        : 'Guest';
      
      newState = {
        ...state,
        user: {
          id: crypto.randomUUID(),
          username: sanitizedUsername,
          balance: validateBalance(state.settings.defaultBalance),
          createdAt: new Date(),
        },
      };
      break;

    case 'LOGIN_GUEST':
      newState = {
        ...state,
        user: {
          id: crypto.randomUUID(),
          username: `Guest_${Math.floor(Math.random() * 10000)}`,
          balance: validateBalance(state.settings.defaultBalance),
          createdAt: new Date(),
        },
      };
      break;

    case 'LOGOUT':
      newState = { ...state, user: null };
      break;

    case 'UPDATE_BALANCE':
      if (!state.user) return state;
      newState = {
        ...state,
        user: { ...state.user, balance: validateBalance(action.payload) },
      };
      break;

    case 'ADD_GAME_LOG':
      // Validate and sanitize game log data
      const validatedLog: Omit<GameLog, 'id' | 'timestamp'> = {
        userId: typeof action.payload.userId === 'string' ? action.payload.userId : '',
        game: ['slots', 'dice', 'roulette', 'blackjack'].includes(action.payload.game)
          ? action.payload.game
          : 'slots',
        bet: validateBetAmount(action.payload.bet, BOUNDS.MAX_BET),
        result: typeof action.payload.result === 'string' ? action.payload.result.slice(0, 200) : '',
        win: validateBalance(action.payload.win),
        balanceAfter: validateBalance(action.payload.balanceAfter),
        seed: typeof action.payload.seed === 'number' ? action.payload.seed : 0,
      };
      
      newState = {
        ...state,
        gameLogs: [
          {
            ...validatedLog,
            id: crypto.randomUUID(),
            timestamp: new Date(),
          },
          ...state.gameLogs,
        ].slice(0, 1000), // Keep last 1000 logs
      };
      break;

    case 'UPDATE_SETTINGS':
      // Validate and sanitize all settings
      const validatedSettings: Partial<CasinoSettings> = {};
      
      if (action.payload.defaultBalance !== undefined) {
        validatedSettings.defaultBalance = validateDefaultBalance(action.payload.defaultBalance);
      }
      if (action.payload.slotRTP !== undefined) {
        validatedSettings.slotRTP = validateSlotRTP(action.payload.slotRTP);
      }
      if (action.payload.diceHouseEdge !== undefined) {
        validatedSettings.diceHouseEdge = validateDiceHouseEdge(action.payload.diceHouseEdge);
      }
      if (action.payload.rngSeed !== undefined) {
        validatedSettings.rngSeed = validateRNGSeed(action.payload.rngSeed);
      }
      
      newState = {
        ...state,
        settings: { ...state.settings, ...validatedSettings },
      };
      // If RNG seed changed, update global RNG
      if (validatedSettings.rngSeed !== undefined) {
        if (validatedSettings.rngSeed !== null) {
          rng.setSeed(validatedSettings.rngSeed);
        } else {
          rng.newSeed();
        }
      }
      break;

    case 'RESET_BALANCE':
      if (!state.user) return state;
      newState = {
        ...state,
        user: { ...state.user, balance: validateBalance(state.settings.defaultBalance) },
      };
      break;

    case 'CLEAR_LOGS':
      newState = { ...state, gameLogs: [] };
      break;

    case 'TOGGLE_ADMIN':
      newState = { ...state, isAdmin: !state.isAdmin };
      break;

    case 'UPDATE_STREAK':
      const { won } = action.payload;
      const newStreaks = { ...state.streaks };
      if (won) {
        newStreaks.currentWinStreak += 1;
        newStreaks.currentLossStreak = 0;
        newStreaks.longestWinStreak = Math.max(newStreaks.longestWinStreak, newStreaks.currentWinStreak);
      } else {
        newStreaks.currentLossStreak += 1;
        newStreaks.currentWinStreak = 0;
        newStreaks.longestLossStreak = Math.max(newStreaks.longestLossStreak, newStreaks.currentLossStreak);
      }
      newState = { ...state, streaks: newStreaks };
      break;

    case 'UPDATE_ACHIEVEMENTS':
      newState = { ...state, achievements: action.payload };
      break;

    case 'CLAIM_DAILY_BONUS':
      const today = new Date().toDateString();
      const lastClaim = state.dailyBonus.lastClaimDate;
      const isConsecutive = lastClaim === today || (lastClaim && new Date(lastClaim).toDateString() === new Date(Date.now() - 86400000).toDateString());
      
      const newConsecutiveDays = Math.min(365, isConsecutive ? state.dailyBonus.consecutiveDays + 1 : 1);
      const bonusAmount = Math.min(1000000, 100 + (newConsecutiveDays - 1) * 50); // Increasing bonus with cap
      
      newState = {
        ...state,
        dailyBonus: {
          lastClaimDate: today,
          consecutiveDays: newConsecutiveDays,
          nextBonusAmount: Math.min(1000000, 100 + newConsecutiveDays * 50),
        },
      };
      
      if (state.user) {
        const newBalance = state.user.balance + bonusAmount;
        newState.user = { ...state.user, balance: Math.min(newBalance, BOUNDS.MAX_BALANCE) };
      }
      break;

    case 'UPDATE_STATS':
      newState = {
        ...state,
        stats: { ...state.stats, ...action.payload },
      };
      break;

    default:
      return state;
  }

  // Persist to localStorage
  try {
    localStorage.setItem('casinoState', JSON.stringify(newState));
  } catch (e) {
    logger.error('Failed to save casino state:', e);
  }

  return newState;
}

// =============================================================================
// CONTEXT
// =============================================================================

interface CasinoContextType {
  state: CasinoState;
  dispatch: React.Dispatch<CasinoAction>;
  // Convenience methods
  login: (username: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
  placeBet: (amount: number) => boolean;
  addWinnings: (amount: number) => void;
  logGame: (log: Omit<GameLog, 'id' | 'timestamp' | 'userId'>) => void;
  updateStreak: (won: boolean) => void;
  claimDailyBonus: () => void;
  checkAndUpdateAchievements: () => void;
}

const CasinoContext = createContext<CasinoContextType | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

export function CasinoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(casinoReducer, undefined, loadState);

  const login = (username: string) => {
    dispatch({ type: 'LOGIN', payload: { username } });
  };

  const loginAsGuest = () => {
    dispatch({ type: 'LOGIN_GUEST' });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const placeBet = (amount: number): boolean => {
    if (!state.user) return false;
    
    // Validate and sanitize bet amount
    const validatedAmount = validateBetAmount(amount, state.user.balance);
    
    // Ensure user has sufficient balance
    if (state.user.balance < validatedAmount) return false;
    
    // Ensure bet is within bounds
    if (validatedAmount < BOUNDS.MIN_BET || validatedAmount > BOUNDS.MAX_BET) {
      return false;
    }
    
    dispatch({ type: 'UPDATE_BALANCE', payload: state.user.balance - validatedAmount });
    return true;
  };

  const addWinnings = (amount: number) => {
    if (!state.user) return;
    
    // Validate and sanitize winnings amount
    const validatedAmount = Math.max(0, Math.min(BOUNDS.MAX_BALANCE, amount));
    const newBalance = state.user.balance + validatedAmount;
    
    // Ensure balance doesn't exceed maximum
    const finalBalance = Math.min(newBalance, BOUNDS.MAX_BALANCE);
    
    dispatch({ type: 'UPDATE_BALANCE', payload: finalBalance });
  };

  const logGame = (log: Omit<GameLog, 'id' | 'timestamp' | 'userId'>) => {
    if (!state.user) return;
    dispatch({
      type: 'ADD_GAME_LOG',
      payload: { ...log, userId: state.user.id },
    });
    
    // Update stats
    const isWin = log.win > 0;
    dispatch({
      type: 'UPDATE_STATS',
      payload: {
        totalGames: state.stats.totalGames + 1,
        totalWins: state.stats.totalWins + (isWin ? 1 : 0),
        biggestWin: Math.max(state.stats.biggestWin, log.win),
        biggestBet: Math.max(state.stats.biggestBet, log.bet),
        gameWins: {
          ...state.stats.gameWins,
          [log.game]: (state.stats.gameWins[log.game] || 0) + (isWin ? 1 : 0),
        },
      },
    });
    
    // Update streak
    updateStreak(isWin);
  };

  const updateStreak = (won: boolean) => {
    dispatch({ type: 'UPDATE_STREAK', payload: { won } });
  };

  const claimDailyBonus = () => {
    dispatch({ type: 'CLAIM_DAILY_BONUS', payload: 0 });
  };

  const checkAndUpdateAchievements = () => {
    if (!state.user) return;
    
    const stats = {
      totalWins: state.stats.totalWins,
      totalGames: state.stats.totalGames,
      currentBalance: state.user.balance,
      currentStreak: state.streaks.currentWinStreak,
      biggestWin: state.stats.biggestWin,
      biggestBet: state.stats.biggestBet,
      gameWins: state.stats.gameWins,
      specialEvents: state.stats.specialEvents,
    };
    
    const updated = checkAchievements(state.achievements, stats);
    const newlyUnlocked = updated.filter(
      (a, i) => a.unlocked && (!state.achievements[i] || !state.achievements[i].unlocked)
    );
    
    dispatch({ type: 'UPDATE_ACHIEVEMENTS', payload: updated });
    
    // Return newly unlocked achievements for notification
    return newlyUnlocked.map(a => ACHIEVEMENTS.find(ach => ach.id === a.achievementId)).filter(Boolean);
  };

  // Note: Achievement checking should be called manually after game results

  return (
    <CasinoContext.Provider
      value={{
        state,
        dispatch,
        login,
        loginAsGuest,
        logout,
        placeBet,
        addWinnings,
        logGame,
        updateStreak,
        claimDailyBonus,
        checkAndUpdateAchievements,
      }}
    >
      {children}
    </CasinoContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useCasino() {
  const context = useContext(CasinoContext);
  if (!context) {
    throw new Error('useCasino must be used within a CasinoProvider');
  }
  return context;
}
