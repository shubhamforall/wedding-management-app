import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-bg-subtle text-text-muted',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
};

export function Badge({ tone = 'neutral', className, ...props }: { tone?: Tone } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
