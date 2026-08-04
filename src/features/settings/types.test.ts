import { describe, expect, it } from 'vitest';
import { computeReorderSwap } from './types';
import type { ListOption } from '@/types/database';

function row(id: string, sort_order: number): ListOption {
  return { id, wedding_id: 'w1', list_type: 'task_category', value: id, sort_order, is_active: true };
}

describe('computeReorderSwap', () => {
  const list = [row('a', 1), row('b', 2), row('c', 3)];

  it('swaps with the previous row when moving up', () => {
    expect(computeReorderSwap(list, 1, 'up')).toEqual([
      { id: 'b', sort_order: 1 },
      { id: 'a', sort_order: 2 },
    ]);
  });

  it('swaps with the next row when moving down', () => {
    expect(computeReorderSwap(list, 1, 'down')).toEqual([
      { id: 'b', sort_order: 3 },
      { id: 'c', sort_order: 2 },
    ]);
  });

  it('returns null when moving the first row up', () => {
    expect(computeReorderSwap(list, 0, 'up')).toBeNull();
  });

  it('returns null when moving the last row down', () => {
    expect(computeReorderSwap(list, 2, 'down')).toBeNull();
  });
});
