import { AttributeDto } from "../../dtos/attribute.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { AttributeModel } from "../../models/attribute.model";
import { AttributeFilterParams } from "../../params/attribute.params";

export interface IAttributeService {
  getAll(filters?: AttributeFilterParams): Promise<ListResponseDto<AttributeDto>>;
  getById(id: number): Promise<AttributeDto | null>;
  create(data: AttributeModel, storeCode: string): Promise<AttributeDto>;
  update(id: number, data: AttributeModel): Promise<AttributeDto>;
  delete(id: number): Promise<AttributeDto>;
}
