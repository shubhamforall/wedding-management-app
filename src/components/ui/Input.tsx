import { forwardRef, useImperativeHandle, useRef, type MouseEvent, type InputHTMLAttributes } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, onClick, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    const inputId = id ?? props.name;
    const type = props.type?.toString();
    const hasPickerIcon = ['date', 'datetime-local', 'month', 'time', 'week'].includes(type ?? '');
    const PickerIcon = type === 'time' ? Clock : Calendar;

    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    function handleClick(event: MouseEvent<HTMLInputElement>) {
      onClick?.(event);

      if (!hasPickerIcon || props.disabled || props.readOnly || event.defaultPrevented) return;

      try {
        innerRef.current?.showPicker?.();
      } catch {
        // Some browsers only allow showPicker during trusted pointer events.
      }
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={innerRef}
            id={inputId}
            className={cn(
              'h-11 w-full rounded-[var(--radius-md)] border border-border bg-bg px-3.5 text-sm text-text',
              'placeholder:text-text-faint',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              hasPickerIcon && 'pr-11',
              error && 'border-danger',
              className
            )}
            aria-invalid={!!error}
            onClick={handleClick}
            {...props}
          />
          {hasPickerIcon && (
            <PickerIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          )}
        </div>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
