import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ThemeModeContext,
  storePref,
  readStoredPref,
  getSystemMode,
  type ThemeModePref,
  type ResolvedThemeMode,
} from '@/contexts/themeModeContext';

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [modePref, setModePrefState] = useState<ThemeModePref>(() => readStoredPref());
  const [systemMode, setSystemMode] = useState<ResolvedThemeMode>(() => getSystemMode());

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemMode(e.matches ? 'dark' : 'light');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const setModePref = useCallback((pref: ThemeModePref) => {
    setModePrefState(pref);
    storePref(pref);
  }, []);

  const resolvedMode: ResolvedThemeMode = modePref === 'system' ? systemMode : modePref;

  const value = useMemo(
    () => ({ modePref, resolvedMode, setModePref }),
    [modePref, resolvedMode, setModePref],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}
