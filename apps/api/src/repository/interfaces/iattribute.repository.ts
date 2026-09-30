import { AttributeDto, AttributeFilterParams, ListResponseDto } from "@pms/types";

export interface IAttributeRepository {
  findAll(filters?: AttributeFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<AttributeDto>>;
  findById(id: number, storeCode: string): Promise<AttributeDto | null>;
  delete(id: number, storeCode: string): Promise<AttributeDto>;
  /** Live products that still point at this attribute. */
  countProducts(id: number, storeCode: string): Promise<number>;
}
