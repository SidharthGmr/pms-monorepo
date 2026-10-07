import { Role, Status } from "@prisma/client";
import { PageFilterParams } from "./page.params";
export interface UserFilterParams extends PageFilterParams {
  email?: string;
  userId?: string;
  isActive?: boolean;
  status?: Status;
  role?: Role;
  phone?: string;
  /** One of SORTABLE_COLUMNS in user.repository.ts; anything else falls back to createdAt. */
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}
