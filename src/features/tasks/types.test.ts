import { describe, expect, it } from 'vitest';
import { isOverdue } from './types';

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  // Local date, matching isOverdue's local-date comparison — toISOString()
  // would convert to UTC first and could land on the wrong calendar day.
  return d.toLocaleDateString('en-CA');
}

describe('isOverdue', () => {
  it('is false for a task with no due date', () => {
    expect(isOverdue({ status: 'Not Started', due_date: null })).toBe(false);
  });

  it('is false for a completed task even if the due date has passed', () => {
    expect(isOverdue({ status: 'Completed', due_date: daysFromNow(-5) })).toBe(false);
  });

  it('is true for an incomplete task past its due date', () => {
    expect(isOverdue({ status: 'In Progress', due_date: daysFromNow(-1) })).toBe(true);
  });

  it('is false for an incomplete task due today or in the future', () => {
    expect(isOverdue({ status: 'Not Started', due_date: daysFromNow(0) })).toBe(false);
    expect(isOverdue({ status: 'Not Started', due_date: daysFromNow(3) })).toBe(false);
  });
});
