import { Status } from '../enum/status.enum';

export interface CreateStoreModel {
  name: string;
  code: string;
  phone?: string;
  email: string;
  siteName?: string;
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
}

// `code` is deliberately absent: the tenant key every row hangs off is written once at
// creation and can never be changed.
export interface UpdateStoreModel {
  name?: string;
  phone?: string;
  email?: string;
  siteName?: string;
  storeLogo?: string;
  isActive?: boolean;
  status?: Status;
}
