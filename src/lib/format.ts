const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCurrency(amount: number, compact = false) {
  return (compact ? compactCurrencyFormatter : currencyFormatter).format(amount);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value);
}
