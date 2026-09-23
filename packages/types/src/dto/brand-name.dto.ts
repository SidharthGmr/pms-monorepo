import { Status } from "../enum/status.enum";


export interface BrandNameDto {
  id: number;
  name: string;
  images?: string[];
  status: Status;
  /** Matches the `Int?` column - the API always returns a number, never a string. */
  displayOrder?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}
