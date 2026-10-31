import { useContext } from 'react';
import { AppContext, type AppContextValue } from '@/contexts/appContextInstance';

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return ctx;
}
