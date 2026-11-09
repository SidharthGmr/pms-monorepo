import { Status } from '../enum/status.enum';

export interface StoreDto {
  id: number;
  name: string;
  code: string;
  phone?: string | null;
  email: string;
  /** Brand name shown on invoices and emails in place of the app name. */
  siteName?: string | null;
  /** The store's GST registration, printed on every tax invoice. */
  gstin?: string | null;
  stateCode?: string | null;
  /** URL of the store's uploaded logo; null means the bundled default. */
  storeLogo?: string | null;
  isActive: boolean;
  status: Status;
  createdAt: Date | string;
  // `store.updatedAt` is nullable in the schema - a store that has never been edited has none.
  updatedAt: Date | string | null;
}

export interface CreateStoreDto {
  name: string;
  code: string;
  phone?: string;
  email: string;
  siteName?: string;
  storeLogo?: string;
  isActive?: boolean;
  status?: Status;
}

// `code` is deliberately absent: the tenant key is written once at creation, never updated.
export interface UpdateStoreDto {
  name?: string;
  phone?: string;
  email?: string;
  siteName?: string;
  storeLogo?: string;
  isActive?: boolean;
  status?: Status;
}
