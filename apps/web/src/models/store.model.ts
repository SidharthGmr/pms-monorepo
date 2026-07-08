export interface CreateStoreModel {
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
    status?: string;
}

export interface UpdateStoreModel {
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
    status?: string;
}
