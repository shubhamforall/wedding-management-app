import { createCrudApi } from '@/lib/createCrudApi';
import type { Vendor, VendorInput } from './types';

const crud = createCrudApi<Vendor, VendorInput>('vendors');

export const fetchVendors = crud.fetchAll;
export const createVendor = crud.create;
export const updateVendor = crud.update;
export const deleteVendor = crud.remove;
