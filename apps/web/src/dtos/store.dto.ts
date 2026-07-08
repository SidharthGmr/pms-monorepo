export interface StoreDto {
    id: number;
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    isActive: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
