import { Status } from "../enum/status.enum";

export interface AttributeModel {
  name: string;
  unit?: string;
  status?: Status;
  displayOrder?: number;
}
