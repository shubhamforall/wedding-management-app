import {
  LayoutDashboard,
  Users,
  Wallet,
  CheckSquare,
  ShoppingBag,
  Package,
  Store,
  CalendarDays,
  Building2,
  Contact,
  FolderOpen,
  UserCog,
  Settings,
  Search,
  IdCard,
  Bell,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const primaryNav: NavItem[] = [
  { label: 'Dashboard', path: '', icon: LayoutDashboard },
  { label: 'Guests', path: 'guests', icon: Users },
  { label: 'Finance', path: 'finance', icon: Wallet },
  { label: 'Tasks', path: 'tasks', icon: CheckSquare },
];

const secondaryNav: NavItem[] = [
  { label: 'Wedding Info', path: 'wedding-info', icon: IdCard },
  { label: 'Shopping', path: 'shopping', icon: ShoppingBag },
  { label: 'Inventory', path: 'inventory', icon: Package },
  { label: 'Vendors', path: 'vendors', icon: Store },
  { label: 'Timeline', path: 'timeline', icon: CalendarDays },
  { label: 'Stay Arrangement', path: 'stay', icon: Building2 },
  { label: 'Contacts', path: 'contacts', icon: Contact },
  { label: 'Documents', path: 'documents', icon: FolderOpen },
  { label: 'Members', path: 'members', icon: UserCog },
  { label: 'Search', path: 'search', icon: Search },
  { label: 'Notifications', path: 'notifications', icon: Bell },
  { label: 'Settings', path: 'settings', icon: Settings },
];

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const allSidebarItems = [...primaryNav, ...secondaryNav];
const byLabel = (label: string) => allSidebarItems.find((item) => item.label === label)!;

// Top: Dashboard only — the one workspace-level overview link left in the
// sidebar. Bottom: every module that's actually wedding planning content.
// Members, Settings, and Wedding Info are deliberately excluded here: they
// moved to the profile panel (see AccountPanel.tsx), triggered from the
// top-bar avatar, since they're account/workspace-management surfaces
// visited far less often than the planning modules below — keeping them
// out of the sidebar keeps that list to what's used daily. Search and
// Notifications are also excluded: Notifications lives as the bell icon in
// AppShell's top-right corner, and Search is a direct input rendered
// inline above this nav (see Sidebar.tsx) rather than a link to a page.
// This is the single nav source for both desktop (fixed rail) and mobile
// (hamburger-triggered slide-in drawer) — same component, same list.
export const sidebarNavGroups: NavGroup[] = [
  {
    label: null,
    items: [byLabel('Dashboard')],
  },
  {
    label: null,
    items: [
      byLabel('Guests'),
      byLabel('Finance'),
      byLabel('Tasks'),
      byLabel('Shopping'),
      byLabel('Inventory'),
      byLabel('Vendors'),
      byLabel('Timeline'),
      byLabel('Stay Arrangement'),
      byLabel('Contacts'),
      byLabel('Documents'),
    ],
  },
];

// Consumed by AccountPanel.tsx — the three items moved out of the sidebar.
export const accountPanelNav: NavItem[] = [byLabel('Wedding Info'), byLabel('Members'), byLabel('Settings')];
