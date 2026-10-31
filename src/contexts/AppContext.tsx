import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authLib, type GameHubUser } from '@/libs/auth';
import { AppContext, type AppContextValue } from './appContextInstance';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GameHubUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
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

    unsub = authLib.onAuthStateChanged((u, denied) => {
      setUser(u);
      if (denied) setAccessDenied(true);
      setIsAuthLoading(false);
    });

    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const signedIn = await authLib.signInWithGoogle();
      if (signedIn) {
        setAccessDenied(false);
        setUser(signedIn);
      }
      return signedIn;
    } catch (error) {
      if ((error as { code?: string })?.code === 'gamehub/access-denied') setAccessDenied(true);
      throw error;
    }
  };

  const logout = async () => {
    await authLib.logout();
    qc.clear(); // purge cached data so a different account never bleeds through
    setUser(null);
  };

  const value: AppContextValue = { user, isAuthLoading, accessDenied, loginWithGoogle, logout };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
