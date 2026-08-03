export interface InventoryItem {
  id: string;
  wedding_id: string;
  item: string;
  required_qty: number | null;
  available_qty: number | null;
  responsible_person: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemInput {
  item: string;
  required_qty: number | null;
  available_qty: number | null;
  responsible_person: string | null;
  status: string | null;
  notes: string | null;
}

export function shortfall(item: Pick<InventoryItem, 'required_qty' | 'available_qty'>) {
  return Math.max(0, (item.required_qty ?? 0) - (item.available_qty ?? 0));
}
