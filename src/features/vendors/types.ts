export interface Vendor {
  id: string;
  wedding_id: string;
  name: string;
  category: string | null;
  handled_by: string | null;
  phone: string | null;
  alternate_phone: string | null;
  address: string | null;
  total_amount: number;
  advance_paid: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorInput {
  name: string;
  category: string | null;
  handled_by: string | null;
  phone: string | null;
  alternate_phone: string | null;
  address: string | null;
  total_amount: number;
  advance_paid: number;
  notes: string | null;
}

export function remainingAmount(vendor: Pick<Vendor, 'total_amount' | 'advance_paid'>) {
  return vendor.total_amount - vendor.advance_paid;
}

export function vendorStatus(vendor: Pick<Vendor, 'total_amount' | 'advance_paid'>): 'Fully Paid' | 'Pending' {
  return remainingAmount(vendor) <= 0 ? 'Fully Paid' : 'Pending';
}
