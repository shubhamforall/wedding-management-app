import type { ReactNode } from 'react';
import { Heart } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg-subtle px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-fg">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <h1 className="text-xl font-semibold text-text">{title}</h1>
          {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
        </div>
        <Card className="p-6">{children}</Card>
      </div>
    </div>
  );
}
