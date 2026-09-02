import { Status } from "../enum/status.enum";



export interface CreateBrandModel {
  name: string;
  images?: string[];
  storeCode: string
  status: Status;
  displayOrder?: number | null;
}
