export interface StaffDto {
  id: number;
  /** The users.userId uuid, not a numeric id. */
  userId: string;
  /** Multi-tenancy key: `store.code`, matching every other model. */
  storeCode: string;
  position?: string | null;
  department?: string | null;
  hireDate: Date | string;
  salary?: number | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    role?: string;
  };
  store?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface CreateStaffDto {
  position?: string | null;
  department?: string | null;
  hireDate?: Date;
  salary?: number | null;
  isActive?: boolean;
}

export interface UpdateStaffDto {
  storeId?: number;
  position?: string | null;
  department?: string | null;
  hireDate?: Date;
  salary?: number | null;
  isActive?: boolean;
}
