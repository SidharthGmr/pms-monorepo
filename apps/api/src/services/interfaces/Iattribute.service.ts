import { AttributeDto, AttributeFilterParams, AttributeModel, ListResponseDto } from "@pms/types";

export interface IAttributeService {
  create(data: AttributeModel, storeCode: string): Promise<AttributeDto>;
  getAll(filters?: AttributeFilterParams): Promise<ListResponseDto<AttributeDto>>;
  getById(id: number, storeCode: string): Promise<AttributeDto>;
  update(id: number, data: Partial<AttributeModel>, storeCode: string): Promise<AttributeDto>;
  delete(id: number, storeCode: string): Promise<AttributeDto>;
}
