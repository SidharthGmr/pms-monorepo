import { Status } from "@prisma/client";

export interface StoreDto {
  id: number;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  createdAt: Date;
  // `store.updatedAt` is nullable in the schema - a store that has never been edited has none.
  updatedAt: Date | null;
  status: Status;
}

export interface CreateStoreDto {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  status?: Status;
}

export interface UpdateStoreDto {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  status?: Status;
}
