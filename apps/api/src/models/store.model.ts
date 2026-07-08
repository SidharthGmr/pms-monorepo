import { Status } from "@prisma/client";

export interface CreateStoreModel {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  status?: Status;
}

export interface UpdateStoreModel {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  status?: Status;
}
