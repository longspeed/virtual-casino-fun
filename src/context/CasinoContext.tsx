import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { rng } from '@/lib/rng';

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
  game: 'slots' | 'dice' | 'roulette';
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

interface CasinoState {
  user: User | null;
  settings: CasinoSettings;
  gameLogs: GameLog[];
  isAdmin: boolean;
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
  | { type: 'TOGGLE_ADMIN' };

// =============================================================================
// INITIAL STATE
// =============================================================================

const DEFAULT_SETTINGS: CasinoSettings = {
  defaultBalance: 10000,
  slotRTP: 0.96, // 96% RTP
  diceHouseEdge: 0.02, // 2% house edge
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
  };

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
