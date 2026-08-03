import { NavLink } from 'react-router-dom';
import { primaryNav } from '@/app/navigation';
import { cn } from '@/lib/cn';

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-raised/95 backdrop-blur md:hidden">
      <div className="flex items-stretch justify-around" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {primaryNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === ''}
            className={({ isActive }) =>
              cn(
                'flex min-w-16 flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-text-muted'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
