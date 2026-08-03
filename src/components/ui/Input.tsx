import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 w-full rounded-[var(--radius-md)] border border-border bg-bg px-3.5 text-sm text-text',
            'placeholder:text-text-faint',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            error && 'border-danger',
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
