import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg-raised text-text-muted transition-colors hover:bg-bg-subtle hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
