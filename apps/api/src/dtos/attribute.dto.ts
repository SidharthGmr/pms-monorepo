import { Status } from "@prisma/client";

export interface AttributeDto {
  id: number;
  name: string;
  unit?: string | null;
  storeCode: string
  status: Status;
  displayOrder?: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

 