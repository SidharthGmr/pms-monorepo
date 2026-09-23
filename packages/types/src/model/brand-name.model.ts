import { Status } from "../enum/status.enum";


export interface CreateBrandNameModel {
  name: string;
  images?: string[];
  status?: Status;
  /** The wire/DB type. The form holds the raw text and the validator coerces it on submit. */
  displayOrder?: number | null;
}
