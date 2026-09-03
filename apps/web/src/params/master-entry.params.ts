import { PageFilterParams } from './page.params';

export interface MasterAttributeFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
  status?: string | null;
  code?: string;
  startDate?: string;
  endDate?: string;
}

export interface MasterEntryFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
  status?: string | null;
  attributeId?: number;
  /** Filter by the parent's stable code (e.g. "SIZE") - how dropdowns select values. */
  attributeCode?: string;
  startDate?: string;
  endDate?: string;
}
