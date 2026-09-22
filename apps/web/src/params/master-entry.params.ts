import { PageFilterParams } from './page.params';

export interface MasterAttributeFilterParams extends Omit<PageFilterParams, 'startDate' | 'endDate'> {
  status?: string | null;
  code?: string;
  /** Returns the attributes scoped to this category plus the unscoped ones. */
  categoryId?: number;
  /** Returns the attributes scoped to this brand plus the unscoped ones. */
  brandNameId?: number;
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
