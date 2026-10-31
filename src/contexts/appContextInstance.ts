import { createContext } from 'react';
import type { GameHubUser } from '@/libs/auth';

export interface AppContextValue {
  user: GameHubUser | null;
  isAuthLoading: boolean;
  accessDenied: boolean;
  loginWithGoogle: () => Promise<GameHubUser | null>;
  logout: () => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);
