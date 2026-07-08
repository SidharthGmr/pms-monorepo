import { Role, Status } from "@prisma/client";
import { PageFilterParams } from "./page.params";
export interface UserFilterParams extends PageFilterParams {
  email?: string;
  userId?: string;
  isActive?: boolean;
  status?: Status;
  role?: Role;
  phone?: string;
}
