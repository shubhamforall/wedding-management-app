import type { ListOption, ListType } from '@/types/database';

export const LIST_TYPE_LABELS: Record<ListType, string> = {
  family_members: 'Family Members',
  budget_category: 'Budget Categories',
  vendor_category: 'Vendor Categories',
  payment_mode: 'Payment Mode',
  expense_status: 'Expense Status',
  invitation_status: 'Invitation Status',
  shopping_category: 'Shopping Categories',
  shopping_status: 'Shopping Status',
  inventory_status: 'Inventory Status',
  task_category: 'Task Category',
  task_priority: 'Task Priority',
  task_status: 'Task Status',
  timeline_event: 'Timeline Event',
  timeline_status: 'Timeline Status',
  contact_type: 'Contact Type',
  document_category: 'Document Category',
};

export const LIST_TYPES = Object.keys(LIST_TYPE_LABELS) as ListType[];

/**
 * Given a sorted list and the index to move, returns the two rows (with
 * their swapped sort_order values) that need writing back, or null if the
 * move is out of bounds (already first/last).
 */
export function computeReorderSwap(
  list: ListOption[],
  index: number,
  direction: 'up' | 'down'
): { id: string; sort_order: number }[] | null {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length || index < 0 || index >= list.length) return null;

  const current = list[index]!;
  const target = list[targetIndex]!;

  return [
    { id: current.id, sort_order: target.sort_order },
    { id: target.id, sort_order: current.sort_order },
  ];
}
