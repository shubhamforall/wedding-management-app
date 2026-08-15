import { createSimpleCrudRouter } from './createSimpleCrudRouter';
import {
  guestSchemas,
  vendorSchemas,
  expenseSchemas,
  shoppingItemSchemas,
  inventoryItemSchemas,
  taskSchemas,
  timelineEventSchemas,
  stayArrangementSchemas,
  emergencyContactSchemas,
  importantNumberSchemas,
  manualContactSchemas,
} from '../validators/simpleModuleValidators';

export const guestsRouter = createSimpleCrudRouter({
  table: 'guests',
  columns: [
    'family_name',
    'village_city',
    'phone',
    'whatsapp',
    'total_members',
    'invitation_status',
    'attending_engagement',
    'attending_haldi',
    'attending_wedding',
    'notes',
  ],
  orderBy: 'created_at DESC',
  createSchema: guestSchemas.create,
  updateSchema: guestSchemas.update,
  booleanFields: ['attendingEngagement', 'attendingHaldi', 'attendingWedding'],
});

export const vendorsRouter = createSimpleCrudRouter({
  table: 'vendors',
  columns: ['name', 'category', 'handled_by', 'phone', 'alternate_phone', 'address', 'total_amount', 'advance_paid', 'notes'],
  orderBy: 'created_at DESC',
  createSchema: vendorSchemas.create,
  updateSchema: vendorSchemas.update,
});

export const expensesRouter = createSimpleCrudRouter({
  table: 'expenses',
  columns: ['expense_date', 'category', 'description', 'vendor_id', 'amount', 'paid_by', 'payment_mode', 'notes'],
  orderBy: 'expense_date DESC, created_at DESC',
  createSchema: expenseSchemas.create,
  updateSchema: expenseSchemas.update,
});

export const shoppingItemsRouter = createSimpleCrudRouter({
  table: 'shopping_items',
  columns: ['item', 'category', 'responsible_person', 'actual_cost', 'status', 'notes'],
  orderBy: 'created_at DESC',
  createSchema: shoppingItemSchemas.create,
  updateSchema: shoppingItemSchemas.update,
});

export const inventoryItemsRouter = createSimpleCrudRouter({
  table: 'inventory_items',
  columns: ['item', 'required_qty', 'available_qty', 'responsible_person', 'status', 'notes'],
  orderBy: 'created_at DESC',
  createSchema: inventoryItemSchemas.create,
  updateSchema: inventoryItemSchemas.update,
});

export const tasksRouter = createSimpleCrudRouter({
  table: 'tasks',
  columns: ['task', 'category', 'assigned_to', 'priority', 'start_date', 'due_date', 'status', 'comments'],
  orderBy: 'due_date IS NULL, due_date ASC',
  createSchema: taskSchemas.create,
  updateSchema: taskSchemas.update,
});

export const timelineEventsRouter = createSimpleCrudRouter({
  table: 'timeline_events',
  columns: ['event_name', 'event_date', 'event_time', 'venue', 'responsible_person', 'checklist', 'status', 'notes'],
  orderBy: 'event_date IS NULL, event_date ASC',
  createSchema: timelineEventSchemas.create,
  updateSchema: timelineEventSchemas.update,
});

export const stayArrangementsRouter = createSimpleCrudRouter({
  table: 'stay_arrangements',
  columns: ['guest_id', 'guest_name_freeform', 'villa', 'address', 'responsible_person', 'notes'],
  orderBy: 'created_at DESC',
  createSchema: stayArrangementSchemas.create,
  updateSchema: stayArrangementSchemas.update,
});

export const emergencyContactsRouter = createSimpleCrudRouter({
  table: 'emergency_contacts',
  columns: ['name', 'relation', 'phone', 'notes'],
  orderBy: 'created_at ASC',
  createSchema: emergencyContactSchemas.create,
  updateSchema: emergencyContactSchemas.update,
});

export const importantNumbersRouter = createSimpleCrudRouter({
  table: 'important_numbers',
  columns: ['label', 'phone', 'notes'],
  orderBy: 'created_at ASC',
  createSchema: importantNumberSchemas.create,
  updateSchema: importantNumberSchemas.update,
});

// Contacts table also holds auto_family/auto_vendor rows (derived, read via
// the contacts aggregate endpoint in searchRoutes-adjacent contactsService,
// not this router) — this CRUD router only ever writes source='manual' rows.
export const manualContactsRouter = createSimpleCrudRouter({
  table: 'contacts',
  columns: ['name', 'type', 'phone', 'alternate_phone', 'notes'],
  orderBy: 'created_at DESC',
  createSchema: manualContactSchemas.create,
  updateSchema: manualContactSchemas.update,
});
