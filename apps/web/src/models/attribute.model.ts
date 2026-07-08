export interface CreateAttributeModel {
  name: string;
  unit?: string | null;
  status: string;
  displayOrder?: number | null;
}

export interface UpdateAttributeModel {
  name?: string;
  unit?: string | null;
  status?: string;
  displayOrder?: number | null;
}
