import dayjs from 'dayjs';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  Heart,
  ListTodo,
  Mail,
  PackageX,
  PartyPopper,
  PiggyBank,
  Receipt,
  ShoppingBag,
  Store,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useDashboardStats } from './hooks';
import { AnnouncementCard } from './AnnouncementCard';

export function DashboardPage() {
  const { wedding, role } = useCurrentWedding();
  const { data: stats, isLoading } = useDashboardStats(wedding.id);
  const daysLeft = wedding.wedding_date ? dayjs(wedding.wedding_date).startOf('day').diff(dayjs().startOf('day'), 'day') : null;

  if (isLoading || !stats) return <DashboardSkeleton />;

  const budgetSeverity = stats.budget_utilization_pct > 100 ? 'danger' : stats.budget_utilization_pct >= 80 ? 'warning' : 'success';

  return (
    <div className="space-y-6 p-4 pt-6 pb-6">
      <div>
        <h1 className="text-lg font-semibold text-text">{wedding.name}</h1>
        <p className="text-sm text-text-muted">
          {wedding.bride_name} &amp; {wedding.groom_name} · you&apos;re a {role}
        </p>
      </div>

      <Card className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Heart className="h-5 w-5" fill="currentColor" />
        </div>
        <div>
          {daysLeft !== null ? (
            <p className="text-2xl font-semibold text-text">
              {daysLeft > 0 ? `${daysLeft} days to go` : daysLeft === 0 ? "It's today!" : 'The big day has passed'}
            </p>
          ) : (
            <p className="text-sm text-text-muted">Set your wedding date in Wedding Info to see the countdown.</p>
          )}
        </div>
      </Card>

      <AnnouncementCard weddingId={wedding.id} canEdit={role !== 'viewer'} />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text">Budget</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Budget" value={formatCurrency(stats.total_budget, true)} icon={Wallet} />
          <StatCard label="Total Expenses" value={formatCurrency(stats.total_expenses, true)} icon={Receipt} />
          <StatCard
            label="Remaining Budget"
            value={formatCurrency(stats.remaining_budget, true)}
            icon={PiggyBank}
            severity={stats.remaining_budget < 0 ? 'danger' : 'success'}
          />
          <StatCard
            label="Budget Utilization"
            value={`${stats.budget_utilization_pct}%`}
            icon={Wallet}
            severity={budgetSeverity}
            meterPct={stats.budget_utilization_pct}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text">Guests</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Families" value={formatNumber(stats.total_families)} icon={Users} />
          <StatCard label="Total Members" value={formatNumber(stats.total_members)} icon={UsersRound} />
          <StatCard
            label="Invitations Pending"
            value={formatNumber(stats.invitations_pending)}
            icon={Mail}
            severity={stats.invitations_pending > 0 ? 'warning' : 'success'}
          />
          <StatCard label="Attending Wedding" value={formatNumber(stats.attending_wedding)} icon={PartyPopper} severity="success" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text">Tasks &amp; Shopping</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Pending Tasks" value={formatNumber(stats.pending_tasks)} icon={ListTodo} severity="warning" />
          <StatCard
            label="Overdue Tasks"
            value={formatNumber(stats.overdue_tasks)}
            icon={AlertTriangle}
            severity={stats.overdue_tasks > 0 ? 'danger' : 'success'}
          />
          <StatCard
            label="Task Progress"
            value={`${stats.task_progress_pct}%`}
            icon={CheckCircle2}
            severity={stats.task_progress_pct >= 100 ? 'success' : 'accent'}
            meterPct={stats.task_progress_pct}
          />
          <StatCard
            label="Shopping Progress"
            value={`${stats.shopping_progress_pct}%`}
            icon={ShoppingBag}
            severity={stats.shopping_progress_pct >= 100 ? 'success' : 'accent'}
            meterPct={stats.shopping_progress_pct}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text">Vendors, Inventory &amp; Stay</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Vendor Payments Pending"
            value={formatNumber(stats.vendor_payments_pending)}
            icon={Store}
            severity={stats.vendor_payments_pending > 0 ? 'warning' : 'success'}
          />
          <StatCard
            label="Amount Pending"
            value={formatCurrency(stats.amount_pending, true)}
            icon={CreditCard}
            severity={stats.amount_pending > 0 ? 'warning' : 'success'}
          />
          <StatCard
            label="Inventory Short Items"
            value={formatNumber(stats.inventory_short_items)}
            icon={PackageX}
            severity={stats.inventory_short_items > 0 ? 'danger' : 'success'}
          />
          <StatCard label="Stay Records" value={formatNumber(stats.stay_records)} icon={Building2} />
        </div>
      </section>
    </div>
  );
}
