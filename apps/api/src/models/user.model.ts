import { Role } from "@prisma/client";

export interface CreateUserModel {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  isRegisteredByShop?: boolean;
  role?: Role;
}
