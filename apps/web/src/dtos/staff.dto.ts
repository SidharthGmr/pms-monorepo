export interface StaffDto {
    id: number;
    userId: number;
    storeId: number;
    position?: string | null;
    department?: string | null;
    hireDate: Date;
    salary?: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Related data
    user?: {
        id: number;
        name: string;
        email: string;
        phone?: string | null;
    };
    store?: {
        id: number;
        name: string;
        code: string;
    };
}

export interface CreateStaffDto {
    userId: number;
    storeId: number;
    position?: string | null;
    department?: string | null;
    hireDate?: Date;
    salary?: number | null;
    isActive?: boolean;
}
