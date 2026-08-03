import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, rows = 3, ...props }, ref) => {
    const textareaId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'w-full resize-none rounded-[var(--radius-md)] border border-border bg-bg px-3.5 py-2.5 text-sm text-text',
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
Textarea.displayName = 'Textarea';
