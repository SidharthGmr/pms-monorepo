export interface CreateMasterAttributeModel {
  name: string;
  code: string;
  description?: string | null;
  unit?: string | null;
  /** Required here because the form always picks one; the API treats it as optional. */
  status: string;
  displayOrder?: number | null;
}

export interface CreateMasterEntryModel {
  attributeId: number;
  name: string;
  value: string;
  colorHex?: string | null;
  metadata?: Record<string, unknown> | null;
  /** Required here because the form always picks one; the API treats it as optional. */
  status: string;
  displayOrder?: number | null;
}
