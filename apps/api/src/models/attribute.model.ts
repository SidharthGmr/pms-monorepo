import { Status } from "@prisma/client";

export interface  AttributeModel {
  name: string;
  unit?: string;
  status?: Status;
  displayOrder?: number;
}