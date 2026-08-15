import type { ReactNode } from 'react';

const authImageUrl = '/auth-wedding-generated.png';

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
    <div className="flex min-h-screen w-full items-center justify-center bg-bg-subtle px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[24px] border border-border bg-bg-raised shadow-2xl shadow-black/25 lg:min-h-[620px] lg:grid-cols-[1.02fr_1fr]">
        <div className="relative hidden min-h-[620px] overflow-hidden lg:block">
          <img src={authImageUrl} alt="Wedding collection preview" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/78 via-black/24 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="max-w-sm text-4xl font-semibold leading-tight">Plan every wedding detail with confidence</p>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/78">
              Bring guests, budget, timeline, vendors, shopping, and stays into one calm workspace.
            </p>
            <div className="mt-8 flex gap-2">
              <span className="h-1.5 w-8 rounded-full bg-white" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/45" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/45" />
            </div>
          </div>
        </div>

        <div className="flex min-h-[620px] items-center justify-center bg-bg px-6 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <img src="/brand-logo.svg" alt="Wedding Management" className="h-14 w-14" />
              <div>
                <h1 className="text-3xl font-semibold text-text">{title}</h1>
                {subtitle && <p className="mt-2 text-base text-text-muted">{subtitle}</p>}
              </div>
            </div>

            <div className="rounded-[20px] border border-border bg-bg-raised p-6 shadow-[var(--shadow-md)] sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
