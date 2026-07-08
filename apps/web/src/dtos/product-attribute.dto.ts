import { AttributeDto } from './attribute.dto';
export type { AttributeDto };

export interface ProductAttributeDto {
    id: number;
    productId: number;
    attributeId: number;
    value: string;
    attribute?: AttributeDto | null;
}
