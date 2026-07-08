export interface AttributeDto {
    id: number;
    name: string;
    unit?: string | null;
    status: string;
    displayOrder?: number | null;
    createdAt: Date;
    updatedAt: Date | null;
}
