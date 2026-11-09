export type PartyType = 'CUSTOMER' | 'SUPPLIER' | 'STAFF' | 'OTHER';

export enum PartyTypeEnum {
  Customer = 'CUSTOMER',
  Supplier = 'SUPPLIER',
  Staff = 'STAFF',
  Other = 'OTHER',
}

export const PARTY_TYPE_LABELS: Record<PartyType, string> = {
  CUSTOMER: 'Customer',
  SUPPLIER: 'Supplier',
  STAFF: 'Staff',
  OTHER: 'Other',
};
