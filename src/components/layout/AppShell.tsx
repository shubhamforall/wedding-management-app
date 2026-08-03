import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { WeddingProvider } from '@/features/weddings/WeddingProvider';

export function AppShell() {
  return (
    <WeddingProvider>
      <div className="min-h-screen bg-bg">
        <Sidebar />
        <BottomNav />
        <main className="min-h-screen pb-20 md:ml-64 md:pb-0">
          <Outlet />
        </main>
      </div>
    </WeddingProvider>
  );
}
