import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import { sidebarNavGroups } from '@/app/navigation';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/Input';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { useMyWeddings } from '@/features/weddings/hooks';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { wedding, role } = useCurrentWedding();
  const { data: weddings } = useMyWeddings();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const switcherWeddings = weddings && weddings.length > 0 ? weddings : [{ ...wedding, role }];

  function submitSearch() {
    const q = searchValue.trim();
    if (!q) return;
    navigate(`/w/${wedding.id}/search?q=${encodeURIComponent(q)}`);
    onMobileClose();
  }

  useEffect(() => {
    if (!isSwitcherOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!switcherRef.current?.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSwitcherOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSwitcherOpen]);

  // Lock body scroll while the mobile drawer is open, and let Escape close it.
  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onMobileClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen, onMobileClose]);

  function switchWedding(weddingId: string) {
    setIsSwitcherOpen(false);
    onMobileClose();

    if (weddingId === wedding.id) return;

    const nextPath = location.pathname.replace(/^\/w\/[^/]+/, `/w/${weddingId}`);
    navigate(`${nextPath}${location.search}${location.hash}`);
  }

  const content = (
    <>
      <div ref={switcherRef} className="relative mb-6">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-left transition-colors hover:bg-bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-haspopup="menu"
          aria-expanded={isSwitcherOpen}
          onClick={() => setIsSwitcherOpen((open) => !open)}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text">{wedding.name}</p>
            <p className="text-xs text-text-muted">Wedding workspace</p>
          </div>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-text-muted transition-transform', isSwitcherOpen && 'rotate-180')}
          />
        </button>

        {isSwitcherOpen && (
          <div
            role="menu"
            className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-[var(--radius-md)] border border-border bg-bg-raised shadow-lg"
          >
            <div className="max-h-72 overflow-y-auto p-1">
              {switcherWeddings.map((item) => {
                const isActive = item.id === wedding.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-text hover:bg-bg-subtle'
                    )}
                    onClick={() => switchWedding(item.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs capitalize text-text-muted">{item.role}</p>
                    </div>
                    {isActive && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-subtle hover:text-text"
              onClick={() => {
                setIsSwitcherOpen(false);
                onMobileClose();
                navigate('/weddings/new');
              }}
            >
              <Plus className="h-4 w-4" />
              Create wedding
            </button>
          </div>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
        <Input
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch();
          }}
          className="h-9 pl-9"
        />
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto">
        {sidebarNavGroups.map((group, groupIndex) => (
          <div key={group.label ?? `group-${groupIndex}`} className="space-y-0.5">
            {group.label && (
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-text-faint">{group.label}</p>
            )}
            {groupIndex > 0 && !group.label && <div className="mx-3 mb-3 border-t border-border-subtle" />}
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === ''}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-bg-subtle hover:text-text'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop: always-visible fixed rail */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-bg-raised p-4 md:flex">
        {content}
      </aside>

      {/* Mobile: slide-in drawer, opened via the hamburger in AppShell's TopBar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-bg-raised p-4 shadow-xl">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                aria-label="Close menu"
                onClick={onMobileClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-bg-subtle hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
