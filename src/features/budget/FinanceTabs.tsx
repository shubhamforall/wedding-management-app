import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/cn';

const tabs = [
  { label: 'Budget', path: '' },
  { label: 'Expenses', path: 'expenses' },
];

export function FinanceTabs() {
  return (
    <div>
      <div className="sticky top-0 z-10 flex gap-1 border-b border-border bg-bg px-4 pt-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end
            className={({ isActive }) =>
              cn(
                'rounded-t-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'border-b-2 border-primary text-primary' : 'text-text-muted hover:text-text'
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
