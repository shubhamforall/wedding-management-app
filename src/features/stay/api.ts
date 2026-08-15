import { createCrudApi } from '@/lib/createCrudApi';
import type { StayArrangement, StayArrangementInput } from './types';

const crud = createCrudApi<StayArrangement, StayArrangementInput>('stay-arrangements');

export const fetchStayArrangements = crud.fetchAll;
export const createStayArrangement = crud.create;
export const updateStayArrangement = crud.update;
export const deleteStayArrangement = crud.remove;
