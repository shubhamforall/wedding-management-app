import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider } from '@/features/auth/AuthProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--color-bg-raised)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
