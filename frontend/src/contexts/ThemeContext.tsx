/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../theme';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedMode: 'light' | 'dark';
  togglePreference: () => void;
}

const STORAGE_KEY = 'theme-preference';

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  resolvedMode: 'light',
  togglePreference: () => {},
});

export function useThemePreference() {
  return useContext(ThemeContext);
}

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'system';
  });

  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedMode: 'light' | 'dark' =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  // Cycles: system → light → dark → system
  const togglePreference = () => {
    const next: ThemePreference =
      preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
    setPreference(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const activeTheme = resolvedMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ preference, resolvedMode, togglePreference }}>
      <ThemeProvider theme={activeTheme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}
