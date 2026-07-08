export interface CreateStaffModel {
    userId: number;
    storeCode: string
    position?: string | null;
    department?: string | null;
    hireDate?: Date;
    salary?: number | null;
    isActive?: boolean;
}

export interface UpdateStaffModel {
    storeId?: number;
    position?: string | null;
    department?: string | null;
    hireDate?: Date;
    salary?: number | null;
    isActive?: boolean;
}
