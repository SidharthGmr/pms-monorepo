import { Status } from '../enum/status.enum';

export interface CreateStoreModel {
  name: string;
  code: string;
  phone?: string;
  email: string;
  siteName?: string;
  /** GST registration printed on every tax invoice; the first two digits are the state code. */
  gstin?: string | null;
  stateCode?: string | null;
  storeLogo?: string;
  isActive?: boolean;
  status?: Status;
}

/** The slice an admin may edit about their own store from Settings - contact details and branding. */
export interface UpdateMyStoreModel {
  name: string;
  phone?: string;
  email: string;
  siteName?: string;
  storeLogo?: string;
  gstin?: string | null;
  stateCode?: string | null;
}

// `code` is deliberately absent: the tenant key every row hangs off is written once at
// creation and can never be changed.
export interface UpdateStoreModel {
  name?: string;
  phone?: string;
  email?: string;
  siteName?: string;
  storeLogo?: string;
  gstin?: string | null;
  stateCode?: string | null;
  isActive?: boolean;
  status?: Status;
}
