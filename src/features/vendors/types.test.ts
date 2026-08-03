import { describe, expect, it } from 'vitest';
import { remainingAmount, vendorStatus } from './types';

describe('remainingAmount', () => {
  it('subtracts advance paid from total amount', () => {
    expect(remainingAmount({ total_amount: 500000, advance_paid: 50000 })).toBe(450000);
  });

  it('can go negative if overpaid', () => {
    expect(remainingAmount({ total_amount: 10000, advance_paid: 15000 })).toBe(-5000);
  });
});

describe('vendorStatus', () => {
  it('is Pending while a balance remains', () => {
    expect(vendorStatus({ total_amount: 500000, advance_paid: 50000 })).toBe('Pending');
  });

  it('is Fully Paid once the balance clears', () => {
    expect(vendorStatus({ total_amount: 500000, advance_paid: 500000 })).toBe('Fully Paid');
  });

  it('is Fully Paid if overpaid', () => {
    expect(vendorStatus({ total_amount: 500000, advance_paid: 600000 })).toBe('Fully Paid');
  });
});
