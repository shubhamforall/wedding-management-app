import { cn } from '@/lib/cn';

function initials(name: string | null | undefined, fallback: string) {
  const source = name?.trim() || fallback;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Avatar({
  name,
  email,
  avatarUrl,
  size = 'md',
  className,
}: {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' }[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? email ?? 'Avatar'}
        className={cn('shrink-0 rounded-full object-cover', sizeClasses, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary',
        sizeClasses,
        className
      )}
    >
      {initials(name, email ?? '?')}
    </div>
  );
}
