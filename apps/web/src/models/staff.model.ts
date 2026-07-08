export interface CreateStaffModel {
    position?: string | null;
    department?: string | null;
    hireDate?: Date;
    salary?: number | null;
    isActive?: boolean;
}

export interface UpdateStaffModel extends Partial<CreateStaffModel> { }
