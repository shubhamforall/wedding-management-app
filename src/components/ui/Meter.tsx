import { cn } from '@/lib/cn';

type Severity = 'accent' | 'warning' | 'danger' | 'success';

const fillClasses: Record<Severity, string> = {
  accent: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

const trackClasses: Record<Severity, string> = {
  accent: 'bg-primary/10',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  danger: 'bg-danger/15',
};

export function Meter({ pct, severity = 'accent', className }: { pct: number; severity?: Severity; className?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full', trackClasses[severity], className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-[width]', fillClasses[severity])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
