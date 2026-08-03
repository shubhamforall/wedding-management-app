export interface ShoppingItem {
  id: string;
  wedding_id: string;
  item: string;
  category: string | null;
  responsible_person: string | null;
  actual_cost: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShoppingItemInput {
  item: string;
  category: string | null;
  responsible_person: string | null;
  actual_cost: number;
  status: string;
  notes: string | null;
}
