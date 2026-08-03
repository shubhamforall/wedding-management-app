import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, label, id, ...props }, ref) => {
  const checkboxId = id ?? props.name;
  return (
    <label htmlFor={checkboxId} className={cn('inline-flex cursor-pointer items-center gap-2 select-none', className)}>
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input ref={ref} id={checkboxId} type="checkbox" className="peer sr-only" {...props} />
        <span
          className={cn(
            'h-5 w-5 rounded-[6px] border border-border bg-bg transition-colors',
            'peer-checked:border-primary peer-checked:bg-primary',
            'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary'
          )}
        />
        <Check className="pointer-events-none absolute h-3.5 w-3.5 text-primary-fg opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      </span>
      {label && <span className="text-sm text-text">{label}</span>}
    </label>
  );
});
Checkbox.displayName = 'Checkbox';
