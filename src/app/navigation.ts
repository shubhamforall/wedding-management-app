import {
  LayoutDashboard,
  Users,
  Wallet,
  CheckSquare,
  MoreHorizontal,
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
  Info,
  Bell,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const primaryNav: NavItem[] = [
  { label: 'Dashboard', path: '', icon: LayoutDashboard },
  { label: 'Guests', path: 'guests', icon: Users },
  { label: 'Finance', path: 'finance', icon: Wallet },
  { label: 'Tasks', path: 'tasks', icon: CheckSquare },
  { label: 'More', path: 'more', icon: MoreHorizontal },
];

export const moreNav: NavItem[] = [
  { label: 'Wedding Info', path: 'wedding-info', icon: Info },
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

const allSidebarItems = [primaryNav[0]!, moreNav[0]!, ...primaryNav.slice(1, -1), ...moreNav.slice(1)];
const byLabel = (label: string) => allSidebarItems.find((item) => item.label === label)!;

// Top: workspace-level nav (overview + collaboration/utility, not wedding
// data entry). Bottom: every module that's actually wedding planning
// content. Two visually separated groups per product request — avoids the
// flat list mixing "manage the workspace" with "plan the wedding".
// Search and Notifications are deliberately excluded here: Notifications
// lives as the bell icon in AppShell's top-right corner, and Search is a
// direct input rendered inline above this nav (see Sidebar.tsx) rather
// than a link to a separate page.
export const sidebarNavGroups: NavGroup[] = [
  {
    label: null,
    items: [byLabel('Dashboard'), byLabel('Members'), byLabel('Settings')],
  },
  {
    label: 'Wedding Planning',
    items: [
      byLabel('Wedding Info'),
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
