import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover',
  secondary: 'bg-bg-subtle text-text border border-border hover:bg-border-subtle',
  ghost: 'text-text hover:bg-bg-subtle',
  danger: 'bg-danger text-white hover:opacity-90',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-[var(--radius-sm)]',
  md: 'h-11 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-5 text-base rounded-[var(--radius-md)]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
