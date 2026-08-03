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
