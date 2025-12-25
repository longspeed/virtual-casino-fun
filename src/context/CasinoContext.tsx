import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { rng } from '@/lib/rng';
import { AchievementProgress, checkAchievements, ACHIEVEMENTS } from '@/lib/achievements';

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
      return {
        ...parsed,
        user: parsed.user ? { ...parsed.user, createdAt: new Date(parsed.user.createdAt) } : null,
        gameLogs: parsed.gameLogs?.map((log: GameLog) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })) || [],
      };
    }
  } catch (e) {
    console.error('Failed to load casino state:', e);
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
      newState = {
        ...state,
        user: {
          id: crypto.randomUUID(),
          username: action.payload.username,
          balance: state.settings.defaultBalance,
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
          balance: state.settings.defaultBalance,
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
        user: { ...state.user, balance: Math.max(0, action.payload) },
      };
      break;

    case 'ADD_GAME_LOG':
      newState = {
        ...state,
        gameLogs: [
          {
            ...action.payload,
            id: crypto.randomUUID(),
            timestamp: new Date(),
          },
          ...state.gameLogs,
        ].slice(0, 1000), // Keep last 1000 logs
      };
      break;

    case 'UPDATE_SETTINGS':
      newState = {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
      // If RNG seed changed, update global RNG
      if (action.payload.rngSeed !== undefined) {
        if (action.payload.rngSeed !== null) {
          rng.setSeed(action.payload.rngSeed);
        } else {
          rng.newSeed();
        }
      }
      break;

    case 'RESET_BALANCE':
      if (!state.user) return state;
      newState = {
        ...state,
        user: { ...state.user, balance: state.settings.defaultBalance },
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
      
      const newConsecutiveDays = isConsecutive ? state.dailyBonus.consecutiveDays + 1 : 1;
      const bonusAmount = 100 + (newConsecutiveDays - 1) * 50; // Increasing bonus
      
      newState = {
        ...state,
        dailyBonus: {
          lastClaimDate: today,
          consecutiveDays: newConsecutiveDays,
          nextBonusAmount: 100 + newConsecutiveDays * 50,
        },
      };
      
      if (state.user) {
        newState.user = { ...state.user, balance: state.user.balance + bonusAmount };
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
    console.error('Failed to save casino state:', e);
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
    if (!state.user || state.user.balance < amount) return false;
    dispatch({ type: 'UPDATE_BALANCE', payload: state.user.balance - amount });
    return true;
  };

  const addWinnings = (amount: number) => {
    if (!state.user) return;
    dispatch({ type: 'UPDATE_BALANCE', payload: state.user.balance + amount });
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
