import { Status } from '../enum/status.enum';

export interface CreateMasterAttributeModel {
  name: string;
  code: string;
  description?: string | null;
  unit?: string | null;
  /** Leave empty to let the attribute apply to every category. */
  categoryId?: number | null;
  /** Leave empty to let the attribute apply to every brand. */
  brandNameId?: number | null;
  status: Status;
  displayOrder?: number | null;
}

export interface CreateMasterEntryModel {
  attributeId: number;
  name: string;
  value: string;
  colorHex?: string | null;
  metadata?: Record<string, unknown> | null;
  status: Status;
  displayOrder?: number | null;
}
