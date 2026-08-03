import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/lib/format';
import type { BudgetSummaryRow } from './types';

// Categorical slots 1 (blue) & 2 (orange) from the validated dataviz palette,
// fixed order: Estimated always slot 1, Actual always slot 2.
const SERIES_COLORS = {
  light: { estimated: '#2a78d6', actual: '#eb6834' },
  dark: { estimated: '#3987e5', actual: '#d95926' },
};

export function BudgetChart({ rows }: { rows: BudgetSummaryRow[] }) {
  const { resolvedTheme } = useTheme();
  const colors = SERIES_COLORS[resolvedTheme];
  const gridColor = resolvedTheme === 'dark' ? '#2c2c2a' : '#e1e0d9';
  const inkColor = resolvedTheme === 'dark' ? '#c3c2b7' : '#52514e';

  const data = rows.map((r) => ({ category: r.category, Estimated: r.estimated_amount, Actual: r.actual_expense }));

  return (
    <div className="min-w-[560px]" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} barGap={2}>
          <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridColor} />
          <XAxis dataKey="category" tick={{ fontSize: 11, fill: inkColor }} axisLine={{ stroke: gridColor }} tickLine={false} interval={0} angle={-30} textAnchor="end" height={70} />
          <YAxis tick={{ fontSize: 11, fill: inkColor }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, true)} width={64} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{
              background: 'var(--color-bg-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--color-text)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: inkColor }} />
          <Bar dataKey="Estimated" fill={colors.estimated} radius={[4, 4, 0, 0]} maxBarSize={24} />
          <Bar dataKey="Actual" fill={colors.actual} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
