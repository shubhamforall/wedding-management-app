import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-11 w-full appearance-none rounded-[var(--radius-md)] border border-border bg-bg px-3.5 pr-10 text-sm text-text',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              error && 'border-danger',
              className
            )}
            aria-invalid={!!error}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        </div>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';
