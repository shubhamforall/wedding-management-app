import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';

const options: { value: ThemePreference; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-border bg-bg-subtle p-1">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] transition-colors',
            theme === value ? 'bg-bg-raised text-text shadow-[var(--shadow-sm)]' : 'text-text-muted hover:text-text'
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
