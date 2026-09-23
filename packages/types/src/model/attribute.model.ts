import { Status } from "../enum/status.enum";

export interface AttributeModel {
  name: string;
  unit?: string | null;
  status: Status;
  displayOrder?: number | null;
}
