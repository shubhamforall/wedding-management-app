import { createCrudApi } from '@/lib/createCrudApi';
import type { ShoppingItem, ShoppingItemInput } from './types';

const crud = createCrudApi<ShoppingItem, ShoppingItemInput>('shopping-items');

export const fetchShoppingItems = crud.fetchAll;
export const createShoppingItem = crud.create;
export const updateShoppingItem = crud.update;
export const deleteShoppingItem = crud.remove;
