import { describe, expect, it } from 'vitest';
import { shortfall } from './types';

describe('shortfall', () => {
  it('is the gap between required and available', () => {
    expect(shortfall({ required_qty: 150, available_qty: 100 })).toBe(50);
  });

  it('never goes negative when available exceeds required', () => {
    expect(shortfall({ required_qty: 100, available_qty: 150 })).toBe(0);
  });

  it('treats null quantities as zero', () => {
    expect(shortfall({ required_qty: null, available_qty: null })).toBe(0);
    expect(shortfall({ required_qty: 20, available_qty: null })).toBe(20);
  });
});
