import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authLib, type GameHubUser } from '@/libs/auth';
import { AppContext, type AppContextValue } from './appContextInstance';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GameHubUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    let unsub = () => {};

    // Resolve a redirect sign-in (iOS Safari) first.
    authLib
      .handleRedirectResult()
      .then((u) => {
        if (u) setUser(u);
      })
      .catch(() => {});

    unsub = authLib.onAuthStateChanged((u) => {
      setUser(u);
      setIsAuthLoading(false);
    });

    return () => unsub();
  }, []);

  const loginWithGoogle = () => authLib.signInWithGoogle();

  const logout = async () => {
    await authLib.logout();
    qc.clear(); // purge cached data so a different account never bleeds through
    setUser(null);
  };

  const value: AppContextValue = { user, isAuthLoading, loginWithGoogle, logout };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
