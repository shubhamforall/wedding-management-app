import { createCrudApi } from '@/lib/createCrudApi';
import type { InventoryItem, InventoryItemInput } from './types';

const crud = createCrudApi<InventoryItem, InventoryItemInput>('inventory-items');

export const fetchInventoryItems = crud.fetchAll;
export const createInventoryItem = crud.create;
export const updateInventoryItem = crud.update;
export const deleteInventoryItem = crud.remove;
