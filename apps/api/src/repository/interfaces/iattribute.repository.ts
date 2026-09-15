import { AttributeDto, AttributeFilterParams, ListResponseDto } from "@pms/types";

export interface IAttributeRepository {
  findAll(filters?: AttributeFilterParams, page?: number, limit?: number): Promise<ListResponseDto<AttributeDto>>;
  findById(id: number): Promise<AttributeDto | null>;
  delete(id: number): Promise<AttributeDto>;
}
