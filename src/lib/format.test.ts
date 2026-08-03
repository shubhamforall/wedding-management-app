import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber } from './format';

describe('formatCurrency', () => {
  it('formats whole rupee amounts with the ₹ symbol and Indian grouping', () => {
    expect(formatCurrency(50000)).toBe('₹50,000');
    expect(formatCurrency(1234567)).toBe('₹12,34,567');
  });

  it('formats zero and negative amounts', () => {
    expect(formatCurrency(0)).toBe('₹0');
    expect(formatCurrency(-2000)).toBe('-₹2,000');
  });

  it('uses compact lakh/crore notation when requested', () => {
    expect(formatCurrency(1250000, true)).toBe('₹12.5L');
  });
});

describe('formatNumber', () => {
  it('groups with Indian digit grouping', () => {
    expect(formatNumber(168)).toBe('168');
    expect(formatNumber(100000)).toBe('1,00,000');
  });
});
