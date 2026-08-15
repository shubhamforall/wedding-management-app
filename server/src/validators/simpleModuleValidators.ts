import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').nullable();
const money = z.number().nonnegative();
const str = (max: number) => z.string().trim().max(max);
const optStr = (max: number) => str(max).nullable().optional();
const uuid = z.string().uuid();

export const guestSchemas = {
  create: z.object({
    familyName: str(255).min(1),
    villageCity: optStr(255),
    phone: optStr(50),
    whatsapp: optStr(50),
    totalMembers: z.number().int().positive().default(1),
    invitationStatus: z.string().max(20).default('No'),
    attendingEngagement: z.boolean().default(false),
    attendingHaldi: z.boolean().default(false),
    attendingWedding: z.boolean().default(false),
    notes: optStr(2000),
  }),
  update: z.object({
    familyName: str(255).min(1).optional(),
    villageCity: optStr(255),
    phone: optStr(50),
    whatsapp: optStr(50),
    totalMembers: z.number().int().positive().optional(),
    invitationStatus: z.string().max(20).optional(),
    attendingEngagement: z.boolean().optional(),
    attendingHaldi: z.boolean().optional(),
    attendingWedding: z.boolean().optional(),
    notes: optStr(2000),
  }),
};

export const vendorSchemas = {
  create: z.object({
    name: str(255).min(1),
    category: optStr(100),
    handledBy: optStr(255),
    phone: optStr(50),
    alternatePhone: optStr(50),
    address: optStr(2000),
    totalAmount: money.default(0),
    advancePaid: money.default(0),
    notes: optStr(2000),
  }),
  update: z.object({
    name: str(255).min(1).optional(),
    category: optStr(100),
    handledBy: optStr(255),
    phone: optStr(50),
    alternatePhone: optStr(50),
    address: optStr(2000),
    totalAmount: money.optional(),
    advancePaid: money.optional(),
    notes: optStr(2000),
  }),
};

export const expenseSchemas = {
  create: z.object({
    expenseDate: dateOnly.optional(),
    category: str(100).min(1),
    description: optStr(2000),
    vendorId: uuid.nullable().optional(),
    amount: money,
    paidBy: optStr(255),
    paymentMode: optStr(50),
    notes: optStr(2000),
  }),
  update: z.object({
    expenseDate: dateOnly.optional(),
    category: str(100).min(1).optional(),
    description: optStr(2000),
    vendorId: uuid.nullable().optional(),
    amount: money.optional(),
    paidBy: optStr(255),
    paymentMode: optStr(50),
    notes: optStr(2000),
  }),
};

export const shoppingItemSchemas = {
  create: z.object({
    item: str(255).min(1),
    category: optStr(100),
    responsiblePerson: optStr(255),
    actualCost: money.default(0),
    status: z.string().max(50).default('Not Started'),
    notes: optStr(2000),
  }),
  update: z.object({
    item: str(255).min(1).optional(),
    category: optStr(100),
    responsiblePerson: optStr(255),
    actualCost: money.optional(),
    status: z.string().max(50).optional(),
    notes: optStr(2000),
  }),
};

export const inventoryItemSchemas = {
  create: z.object({
    item: str(255).min(1),
    requiredQty: z.number().nonnegative().nullable().optional(),
    availableQty: z.number().nonnegative().nullable().optional(),
    responsiblePerson: optStr(255),
    status: optStr(50),
    notes: optStr(2000),
  }),
  update: z.object({
    item: str(255).min(1).optional(),
    requiredQty: z.number().nonnegative().nullable().optional(),
    availableQty: z.number().nonnegative().nullable().optional(),
    responsiblePerson: optStr(255),
    status: optStr(50),
    notes: optStr(2000),
  }),
};

export const taskSchemas = {
  create: z.object({
    task: str(255).min(1),
    category: optStr(100),
    assignedTo: optStr(255),
    priority: optStr(20),
    startDate: dateOnly.optional(),
    dueDate: dateOnly.optional(),
    status: z.string().max(50).default('Not Started'),
    comments: optStr(2000),
  }),
  update: z.object({
    task: str(255).min(1).optional(),
    category: optStr(100),
    assignedTo: optStr(255),
    priority: optStr(20),
    startDate: dateOnly.optional(),
    dueDate: dateOnly.optional(),
    status: z.string().max(50).optional(),
    comments: optStr(2000),
  }),
};

export const timelineEventSchemas = {
  create: z.object({
    eventName: str(255).min(1),
    eventDate: dateOnly.optional(),
    eventTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
    venue: optStr(255),
    responsiblePerson: optStr(255),
    checklist: optStr(2000),
    status: optStr(50),
    notes: optStr(2000),
  }),
  update: z.object({
    eventName: str(255).min(1).optional(),
    eventDate: dateOnly.optional(),
    eventTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
    venue: optStr(255),
    responsiblePerson: optStr(255),
    checklist: optStr(2000),
    status: optStr(50),
    notes: optStr(2000),
  }),
};

export const stayArrangementSchemas = {
  create: z.object({
    guestId: uuid.nullable().optional(),
    guestNameFreeform: optStr(255),
    villa: optStr(255),
    address: optStr(2000),
    responsiblePerson: optStr(255),
    notes: optStr(2000),
  }),
  update: z.object({
    guestId: uuid.nullable().optional(),
    guestNameFreeform: optStr(255),
    villa: optStr(255),
    address: optStr(2000),
    responsiblePerson: optStr(255),
    notes: optStr(2000),
  }),
};

export const emergencyContactSchemas = {
  create: z.object({
    name: str(255).min(1),
    relation: optStr(100),
    phone: optStr(50),
    notes: optStr(2000),
  }),
  update: z.object({
    name: str(255).min(1).optional(),
    relation: optStr(100),
    phone: optStr(50),
    notes: optStr(2000),
  }),
};

export const importantNumberSchemas = {
  create: z.object({
    label: str(255).min(1),
    phone: optStr(50),
    notes: optStr(2000),
  }),
  update: z.object({
    label: str(255).min(1).optional(),
    phone: optStr(50),
    notes: optStr(2000),
  }),
};

export const manualContactSchemas = {
  create: z.object({
    name: str(255).min(1),
    type: optStr(100),
    phone: optStr(50),
    alternatePhone: optStr(50),
    notes: optStr(2000),
  }),
  update: z.object({
    name: str(255).min(1).optional(),
    type: optStr(100),
    phone: optStr(50),
    alternatePhone: optStr(50),
    notes: optStr(2000),
  }),
};
