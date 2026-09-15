import { AttributeDto, AttributeFilterParams, AttributeModel, ListResponseDto } from "@pms/types";

export interface IAttributeService {
  create(data: AttributeModel, storeCode: string): Promise<AttributeDto>;
  getAll(filters?: AttributeFilterParams): Promise<ListResponseDto<AttributeDto>>;
  getById(id: number): Promise<AttributeDto | null>;
  update(id: number, data: AttributeModel): Promise<AttributeDto>;
  delete(id: number): Promise<AttributeDto>;
}
