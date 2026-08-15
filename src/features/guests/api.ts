import { createCrudApi } from '@/lib/createCrudApi';
import type { Guest, GuestInput } from './types';

const crud = createCrudApi<Guest, GuestInput>('guests');

export const fetchGuests = crud.fetchAll;
export const createGuest = crud.create;
export const updateGuest = crud.update;
export const deleteGuest = crud.remove;
