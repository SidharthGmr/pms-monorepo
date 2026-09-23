import { AttributeDto } from '@pms/types';
export type { AttributeDto };

export interface ProductAttributeDto {
    id: number;
    productId: number;
    attributeId: number;
    value: string;
    attribute?: AttributeDto | null;
}
