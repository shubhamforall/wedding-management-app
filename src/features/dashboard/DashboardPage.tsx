import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  ListTodo,
  Mail,
  MapPin,
  PackageX,
  PartyPopper,
  Sparkles,
  Store,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { useTimelineEvents } from '@/features/timeline/hooks';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Meter } from '@/components/ui/Meter';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useDashboardStats } from './hooks';

type Tone = 'accent' | 'warning' | 'danger' | 'success';

const toneIconClasses: Record<Tone, string> = {
  accent: 'bg-primary/10 text-primary',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
};

function BigStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex-1">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-text-faint">{hint}</p>}
    </div>
  );
}

function MetricRow({
  icon: Icon,
  label,
  value,
  tone = 'accent',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]', toneIconClasses[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="flex-1 text-sm text-text-muted">{label}</p>
      <p className="text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function formatPct(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : `${value}%`;
}

function getInitial(value: string | null | undefined) {
  return value?.trim().charAt(0).toUpperCase() || '?';
}

const weddingSideLabel: Record<string, string> = { bride: "Bride's side", groom: "Groom's side", both: 'Both sides' };

const timelineStatusTone: Record<string, 'neutral' | 'info' | 'success'> = {
  Upcoming: 'neutral',
  'In Progress': 'info',
  Done: 'success',
};

export function DashboardPage() {
  const { wedding, role } = useCurrentWedding();
  const { data: stats, isLoading } = useDashboardStats(wedding.id);
  const { data: timelineEvents } = useTimelineEvents(wedding.id);
  const daysLeft = wedding.wedding_date ? dayjs(wedding.wedding_date).startOf('day').diff(dayjs().startOf('day'), 'day') : null;

  if (isLoading || !stats) return <DashboardSkeleton />;

  const budgetSeverity =
    stats.budget_utilization_pct !== null && stats.budget_utilization_pct > 100
      ? 'danger'
      : stats.budget_utilization_pct !== null && stats.budget_utilization_pct >= 80
        ? 'warning'
        : 'success';

  const upcomingEvents = (timelineEvents ?? [])
    .filter((e) => e.status !== 'Done')
    .sort((a, b) => {
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      return a.event_date.localeCompare(b.event_date);
    })
    .slice(0, 5);

  return (
    <div className="space-y-6 p-4 pt-6 pb-6">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-5 bg-linear-to-br from-primary/10 via-transparent to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-fg">
              <span className="text-lg font-semibold">
                {getInitial(wedding.bride_name)}
                <span className="opacity-60">&amp;</span>
                {getInitial(wedding.groom_name)}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-text">{wedding.name}</h1>
              <p className="text-sm text-text-muted">
                {wedding.bride_name} &amp; {wedding.groom_name} · you&apos;re a {role}
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            {daysLeft !== null ? (
              <p className="text-2xl font-semibold text-text">
                {daysLeft > 0 ? `${daysLeft} days to go` : daysLeft === 0 ? "It's today!" : 'The big day has passed'}
              </p>
            ) : (
              <p className="text-sm text-text-muted">Set your wedding date in Wedding Info to see the countdown.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-border-subtle p-5 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted">Wedding Date</p>
              <p className="truncate text-sm font-medium text-text">
                {wedding.wedding_date ? dayjs(wedding.wedding_date).format('DD MMM YYYY') : 'Not set'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted">Venue</p>
              <p className="truncate text-sm font-medium text-text">{wedding.venue || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted">Hosted By</p>
              <p className="truncate text-sm font-medium text-text">{weddingSideLabel[wedding.wedding_side] ?? wedding.wedding_side}</p>
            </div>
          </div>
        </div>
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Upcoming Timeline</h2>
          <Link to={`/w/${wedding.id}/timeline`} className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <Card className="p-4 text-sm text-text-muted">No upcoming timeline events.</Card>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="min-w-[170px] shrink-0 p-4">
                <p className="text-xs text-text-muted">
                  {event.event_date ? dayjs(event.event_date).format('DD MMM YYYY') : 'No date set'}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-text">{event.event_name}</p>
                {event.status && (
                  <Badge tone={timelineStatusTone[event.status] ?? 'neutral'} className="mt-2">
                    {event.status}
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-text">Budget</h2>
            </div>
            <Badge tone={budgetSeverity === 'danger' ? 'danger' : budgetSeverity === 'warning' ? 'warning' : 'success'}>
              {formatPct(stats.budget_utilization_pct)} used
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 border-b border-border-subtle pb-4">
            <BigStat label="Total Budget" value={formatCurrency(stats.total_budget, true)} />
            <BigStat label="Total Expenses" value={formatCurrency(stats.total_expenses, true)} />
            <BigStat
              label="Remaining"
              value={formatCurrency(stats.remaining_budget, true)}
              hint={stats.remaining_budget < 0 ? 'Over budget' : undefined}
            />
          </div>
          <div className="pt-4">
            <Meter pct={stats.budget_utilization_pct ?? 0} severity={budgetSeverity} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-text">Guests</h2>
          </div>
          <div className="flex flex-wrap gap-4 border-b border-border-subtle py-3">
            <BigStat label="Families Invited" value={formatNumber(stats.total_families)} />
            <BigStat label="Total Guests" value={formatNumber(stats.total_members)} />
          </div>
          <div className="divide-y divide-border-subtle">
            <MetricRow
              icon={PartyPopper}
              label="Attending Wedding"
              value={formatNumber(stats.attending_wedding)}
              tone="success"
            />
            <MetricRow
              icon={Mail}
              label="Invitations Pending"
              value={formatNumber(stats.invitations_pending)}
              tone={stats.invitations_pending > 0 ? 'warning' : 'success'}
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-primary/10 text-primary">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-text">Tasks &amp; Shopping</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-text-muted">Task Progress</span>
                <span className="font-medium text-text">{formatPct(stats.task_progress_pct)}</span>
              </div>
              <Meter pct={stats.task_progress_pct ?? 0} severity={(stats.task_progress_pct ?? 0) >= 100 ? 'success' : 'accent'} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-text-muted">Shopping Progress</span>
                <span className="font-medium text-text">{formatPct(stats.shopping_progress_pct)}</span>
              </div>
              <Meter
                pct={stats.shopping_progress_pct ?? 0}
                severity={(stats.shopping_progress_pct ?? 0) >= 100 ? 'success' : 'accent'}
              />
            </div>
          </div>
          <div className="mt-4 divide-y divide-border-subtle border-t border-border-subtle">
            <MetricRow icon={ListTodo} label="Pending Tasks" value={formatNumber(stats.pending_tasks)} tone="warning" />
            <MetricRow
              icon={AlertTriangle}
              label="Overdue Tasks"
              value={formatNumber(stats.overdue_tasks)}
              tone={stats.overdue_tasks > 0 ? 'danger' : 'success'}
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-primary/10 text-primary">
              <Store className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-text">Vendors, Inventory &amp; Stay</h2>
          </div>
          <div className="divide-y divide-border-subtle">
            <MetricRow
              icon={Store}
              label="Vendor Payments Pending"
              value={formatNumber(stats.vendor_payments_pending)}
              tone={stats.vendor_payments_pending > 0 ? 'warning' : 'success'}
            />
            <MetricRow
              icon={CreditCard}
              label="Amount Pending"
              value={formatCurrency(stats.amount_pending, true)}
              tone={stats.amount_pending > 0 ? 'warning' : 'success'}
            />
            <MetricRow
              icon={PackageX}
              label="Inventory Short Items"
              value={formatNumber(stats.inventory_short_items)}
              tone={stats.inventory_short_items > 0 ? 'danger' : 'success'}
            />
            <MetricRow icon={Building2} label="Stay Records" value={formatNumber(stats.stay_records)} />
          </div>
        </Card>
      </div>
    </div>
  );
}
