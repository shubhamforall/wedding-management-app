import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { Meter } from './Meter';
import { cn } from '@/lib/cn';

type Severity = 'accent' | 'warning' | 'danger' | 'success';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  severity?: Severity;
  meterPct?: number;
  hint?: string;
}

const iconToneClasses: Record<Severity, string> = {
  accent: 'bg-primary/10 text-primary',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
};

export function StatCard({ label, value, icon: Icon, severity = 'accent', meterPct, hint }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]', iconToneClasses[severity])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="text-xl font-semibold text-text">{value}</p>
      {meterPct !== undefined && <Meter pct={meterPct} severity={severity} />}
      {hint && <p className="text-xs text-text-faint">{hint}</p>}
    </Card>
  );
}
