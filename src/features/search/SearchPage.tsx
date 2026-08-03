import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Users, Receipt, ShoppingBag, Package, ListTodo, Store, Contact as ContactIcon, FolderOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { useGuests } from '@/features/guests/hooks';
import { useExpenses } from '@/features/expenses/hooks';
import { useShoppingItems } from '@/features/shopping/hooks';
import { useInventoryItems } from '@/features/inventory/hooks';
import { useTasks } from '@/features/tasks/hooks';
import { useVendors } from '@/features/vendors/hooks';
import { useDocuments } from '@/features/documents/hooks';
import { useFamilyEmergencyContacts, useManualContacts } from '@/features/contacts/hooks';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/format';

interface ResultItem {
  id: string;
  title: string;
  subtitle: string;
}

interface Section {
  label: string;
  icon: LucideIcon;
  linkPath: string;
  items: ResultItem[];
}

function matches(query: string, ...fields: (string | null | undefined)[]) {
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}

export function SearchPage() {
  const { wedding } = useCurrentWedding();
  const [query, setQuery] = useState('');

  const { data: guests } = useGuests(wedding.id);
  const { data: expenses } = useExpenses(wedding.id);
  const { data: shoppingItems } = useShoppingItems(wedding.id);
  const { data: inventoryItems } = useInventoryItems(wedding.id);
  const { data: tasks } = useTasks(wedding.id);
  const { data: vendors } = useVendors(wedding.id);
  const { data: documents } = useDocuments(wedding.id);
  const { data: familyContacts } = useFamilyEmergencyContacts(wedding.id);
  const { data: manualContacts } = useManualContacts(wedding.id);

  const sections = useMemo<Section[]>(() => {
    const q = query.trim();
    if (!q) return [];

    return [
      {
        label: 'Guests',
        icon: Users,
        linkPath: 'guests',
        items: (guests ?? [])
          .filter((g) => matches(q, g.family_name, g.village_city, g.phone, g.whatsapp))
          .map((g) => ({ id: g.id, title: g.family_name, subtitle: [g.village_city, g.phone].filter(Boolean).join(' · ') })),
      },
      {
        label: 'Expenses',
        icon: Receipt,
        linkPath: 'finance/expenses',
        items: (expenses ?? [])
          .filter((e) => matches(q, e.description, e.category, e.paid_by))
          .map((e) => ({ id: e.id, title: e.description || e.category, subtitle: formatCurrency(e.amount) })),
      },
      {
        label: 'Shopping',
        icon: ShoppingBag,
        linkPath: 'shopping',
        items: (shoppingItems ?? [])
          .filter((s) => matches(q, s.item, s.category, s.responsible_person))
          .map((s) => ({ id: s.id, title: s.item, subtitle: s.status })),
      },
      {
        label: 'Inventory',
        icon: Package,
        linkPath: 'inventory',
        items: (inventoryItems ?? [])
          .filter((i) => matches(q, i.item, i.responsible_person))
          .map((i) => ({ id: i.id, title: i.item, subtitle: i.status ?? '' })),
      },
      {
        label: 'Tasks',
        icon: ListTodo,
        linkPath: 'tasks',
        items: (tasks ?? [])
          .filter((t) => matches(q, t.task, t.category, t.assigned_to))
          .map((t) => ({ id: t.id, title: t.task, subtitle: t.status })),
      },
      {
        label: 'Vendors',
        icon: Store,
        linkPath: 'vendors',
        items: (vendors ?? [])
          .filter((v) => matches(q, v.name, v.category, v.phone, v.handled_by))
          .map((v) => ({ id: v.id, title: v.name, subtitle: v.category ?? '' })),
      },
      {
        label: 'Contacts',
        icon: ContactIcon,
        linkPath: 'contacts',
        items: [...(familyContacts ?? []), ...(manualContacts ?? [])]
          .filter((c) => matches(q, c.name, c.phone, c.type))
          .map((c) => ({ id: c.id, title: c.name, subtitle: c.type ?? '' })),
      },
      {
        label: 'Documents',
        icon: FolderOpen,
        linkPath: 'documents',
        items: (documents ?? [])
          .filter((d) => matches(q, d.document_name, d.category, d.related_to))
          .map((d) => ({ id: d.id, title: d.document_name, subtitle: d.category ?? '' })),
      },
    ].filter((s) => s.items.length > 0);
  }, [query, guests, expenses, shoppingItems, inventoryItems, tasks, vendors, documents, familyContacts, manualContacts]);

  const totalResults = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div className="p-4 pt-6 pb-6">
      <h1 className="mb-4 text-lg font-semibold text-text">Search</h1>
      <div className="relative mb-6">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
        <Input
          placeholder="Search guests, expenses, tasks, vendors, contacts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          autoFocus
        />
      </div>

      {!query.trim() ? (
        <p className="text-center text-sm text-text-muted">Type a name, phone number, item, or keyword to search everything.</p>
      ) : totalResults === 0 ? (
        <EmptyState icon={SearchIcon} title="No results" description={`Nothing matches "${query}".`} />
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="mb-2 flex items-center gap-2">
                <section.icon className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-text">{section.label}</h2>
                <span className="text-xs text-text-faint">({section.items.length})</span>
              </div>
              <div className="space-y-1.5">
                {section.items.slice(0, 5).map((item) => (
                  <Link key={item.id} to={`/w/${wedding.id}/${section.linkPath}`}>
                    <Card className="flex items-center justify-between p-3 transition-colors hover:border-primary">
                      <span className="truncate text-sm text-text">{item.title}</span>
                      {item.subtitle && <span className="shrink-0 text-xs text-text-muted">{item.subtitle}</span>}
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
