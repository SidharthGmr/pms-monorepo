import { Status } from "../enum/status.enum";



export interface CategoryResponseDto {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  storeCode: string
  status: Status;
  displayOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
}
