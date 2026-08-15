// Exact defaults from the original Supabase migrations (0001's
// seed_default_list_options, 0003's seed_default_budget_lines, 0007's
// seed_default_timeline_events) — ported verbatim so new weddings match
// the old app's behavior exactly, not an approximation.

export const DEFAULT_LIST_OPTIONS: Array<{ listType: string; value: string; sortOrder: number }> = [
  { listType: 'family_members', value: 'Father', sortOrder: 1 },
  { listType: 'family_members', value: 'Mother', sortOrder: 2 },
  { listType: 'family_members', value: 'Brother', sortOrder: 3 },
  { listType: 'family_members', value: 'Sister', sortOrder: 4 },
  { listType: 'family_members', value: 'Uncle', sortOrder: 5 },
  { listType: 'family_members', value: 'Aunt', sortOrder: 6 },
  { listType: 'family_members', value: 'Cousin', sortOrder: 7 },
  { listType: 'family_members', value: 'Self', sortOrder: 8 },
  { listType: 'family_members', value: 'Other', sortOrder: 9 },

  { listType: 'budget_category', value: 'Hall', sortOrder: 1 },
  { listType: 'budget_category', value: 'Decoration', sortOrder: 2 },
  { listType: 'budget_category', value: 'Food', sortOrder: 3 },
  { listType: 'budget_category', value: 'Photography', sortOrder: 4 },
  { listType: 'budget_category', value: 'Invitation', sortOrder: 5 },
  { listType: 'budget_category', value: 'Jewellery', sortOrder: 6 },
  { listType: 'budget_category', value: 'Shopping', sortOrder: 7 },
  { listType: 'budget_category', value: 'Travel', sortOrder: 8 },
  { listType: 'budget_category', value: 'Accommodation', sortOrder: 9 },
  { listType: 'budget_category', value: 'Music', sortOrder: 10 },
  { listType: 'budget_category', value: 'Return Gifts', sortOrder: 11 },
  { listType: 'budget_category', value: 'Miscellaneous', sortOrder: 12 },

  { listType: 'payment_mode', value: 'Cash', sortOrder: 1 },
  { listType: 'payment_mode', value: 'UPI', sortOrder: 2 },
  { listType: 'payment_mode', value: 'Card', sortOrder: 3 },
  { listType: 'payment_mode', value: 'Bank Transfer', sortOrder: 4 },
  { listType: 'payment_mode', value: 'Cheque', sortOrder: 5 },

  { listType: 'expense_status', value: 'Pending', sortOrder: 1 },
  { listType: 'expense_status', value: 'Paid', sortOrder: 2 },
  { listType: 'expense_status', value: 'Cancelled', sortOrder: 3 },

  { listType: 'invitation_status', value: 'Yes', sortOrder: 1 },
  { listType: 'invitation_status', value: 'No', sortOrder: 2 },

  { listType: 'shopping_category', value: 'Groom Outfits', sortOrder: 1 },
  { listType: 'shopping_category', value: 'Bride Outfits', sortOrder: 2 },
  { listType: 'shopping_category', value: 'Family Outfits', sortOrder: 3 },
  { listType: 'shopping_category', value: 'Jewellery', sortOrder: 4 },
  { listType: 'shopping_category', value: 'Return Gifts', sortOrder: 5 },
  { listType: 'shopping_category', value: 'Home & Setup', sortOrder: 6 },
  { listType: 'shopping_category', value: 'Misc', sortOrder: 7 },

  { listType: 'shopping_status', value: 'Not Started', sortOrder: 1 },
  { listType: 'shopping_status', value: 'Ordered', sortOrder: 2 },
  { listType: 'shopping_status', value: 'Purchased', sortOrder: 3 },
  { listType: 'shopping_status', value: 'Delivered', sortOrder: 4 },
  { listType: 'shopping_status', value: 'Alteration Pending', sortOrder: 5 },
  { listType: 'shopping_status', value: 'Completed', sortOrder: 6 },

  { listType: 'inventory_status', value: 'Not Ordered', sortOrder: 1 },
  { listType: 'inventory_status', value: 'Ordered', sortOrder: 2 },
  { listType: 'inventory_status', value: 'In Hand', sortOrder: 3 },
  { listType: 'inventory_status', value: 'Distributed', sortOrder: 4 },

  { listType: 'task_category', value: 'Venue', sortOrder: 1 },
  { listType: 'task_category', value: 'Catering', sortOrder: 2 },
  { listType: 'task_category', value: 'Decor', sortOrder: 3 },
  { listType: 'task_category', value: 'Guests', sortOrder: 4 },
  { listType: 'task_category', value: 'Shopping', sortOrder: 5 },
  { listType: 'task_category', value: 'Documentation', sortOrder: 6 },
  { listType: 'task_category', value: 'Other', sortOrder: 7 },

  { listType: 'task_priority', value: 'High', sortOrder: 1 },
  { listType: 'task_priority', value: 'Medium', sortOrder: 2 },
  { listType: 'task_priority', value: 'Low', sortOrder: 3 },

  { listType: 'task_status', value: 'Not Started', sortOrder: 1 },
  { listType: 'task_status', value: 'In Progress', sortOrder: 2 },
  { listType: 'task_status', value: 'Completed', sortOrder: 3 },

  { listType: 'timeline_event', value: 'Engagement', sortOrder: 1 },
  { listType: 'timeline_event', value: 'Haldi', sortOrder: 2 },
  { listType: 'timeline_event', value: 'Mehendi', sortOrder: 3 },
  { listType: 'timeline_event', value: 'Sangeet', sortOrder: 4 },
  { listType: 'timeline_event', value: 'Wedding', sortOrder: 5 },
  { listType: 'timeline_event', value: 'Reception', sortOrder: 6 },
  { listType: 'timeline_event', value: 'Custom', sortOrder: 7 },

  { listType: 'timeline_status', value: 'Upcoming', sortOrder: 1 },
  { listType: 'timeline_status', value: 'In Progress', sortOrder: 2 },
  { listType: 'timeline_status', value: 'Done', sortOrder: 3 },

  { listType: 'contact_type', value: 'Family', sortOrder: 1 },
  { listType: 'contact_type', value: 'Photographer', sortOrder: 2 },
  { listType: 'contact_type', value: 'Decorator', sortOrder: 3 },
  { listType: 'contact_type', value: 'Caterer', sortOrder: 4 },
  { listType: 'contact_type', value: 'Hotel', sortOrder: 5 },
  { listType: 'contact_type', value: 'Transportation', sortOrder: 6 },
  { listType: 'contact_type', value: 'Emergency', sortOrder: 7 },
  { listType: 'contact_type', value: 'Other Vendor', sortOrder: 8 },

  { listType: 'document_category', value: 'Bill', sortOrder: 1 },
  { listType: 'document_category', value: 'Contract', sortOrder: 2 },
  { listType: 'document_category', value: 'Invitation Design', sortOrder: 3 },
  { listType: 'document_category', value: 'Receipt', sortOrder: 4 },
  { listType: 'document_category', value: 'Important Document', sortOrder: 5 },
  { listType: 'document_category', value: 'Photo', sortOrder: 6 },
  { listType: 'document_category', value: 'Video', sortOrder: 7 },

  { listType: 'vendor_category', value: 'Hall', sortOrder: 1 },
  { listType: 'vendor_category', value: 'Decoration', sortOrder: 2 },
  { listType: 'vendor_category', value: 'Food', sortOrder: 3 },
  { listType: 'vendor_category', value: 'Photography', sortOrder: 4 },
  { listType: 'vendor_category', value: 'Invitation', sortOrder: 5 },
  { listType: 'vendor_category', value: 'Jewellery', sortOrder: 6 },
  { listType: 'vendor_category', value: 'Shopping', sortOrder: 7 },
  { listType: 'vendor_category', value: 'Travel', sortOrder: 8 },
  { listType: 'vendor_category', value: 'Accommodation', sortOrder: 9 },
  { listType: 'vendor_category', value: 'Music', sortOrder: 10 },
  { listType: 'vendor_category', value: 'Return Gifts', sortOrder: 11 },
  { listType: 'vendor_category', value: 'Miscellaneous', sortOrder: 12 },
];

export const DEFAULT_BUDGET_CATEGORIES = [
  'Hall',
  'Decoration',
  'Food',
  'Photography',
  'Invitation',
  'Jewellery',
  'Shopping',
  'Travel',
  'Accommodation',
  'Music',
  'Return Gifts',
  'Miscellaneous',
];

export const DEFAULT_TIMELINE_EVENTS = ['Engagement', 'Haldi', 'Mehendi', 'Sangeet', 'Wedding', 'Reception'];
