import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => void;
}

const STORAGE_KEY = 'wedding-app-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? 'system'
  );
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => setSystemTheme(getSystemTheme());
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = (next: ThemePreference) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
