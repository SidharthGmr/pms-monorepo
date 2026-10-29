import { Status } from '../enum/status.enum';

export interface CreateMasterAttributeModel {
  name: string;
  code: string;
  /** Leave empty to let the attribute apply to every category. */
  categoryId?: number | null;
  /** Leave empty to let the attribute apply to every brand. */
  brandNameId?: number | null;
  status: Status;
  displayOrder?: number | null;
}

/** The add form collects several values at once; each one becomes its own entry. */
export interface CreateMasterEntryModel {
  attributeId: number;
  values: string[];
  status: Status;
  displayOrder?: number | null;
}

/** The edit form works on one existing row, so it carries a single value. */
export interface UpdateMasterEntryModel {
  attributeId: number;
  value: string;
  status: Status;
  displayOrder?: number | null;
}
