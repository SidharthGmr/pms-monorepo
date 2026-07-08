import { AttributeDto } from "../../dtos/attribute.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { AttributeFilterParams } from "../../params/attribute.params";

export interface IAttributeRepository {
  findAll(filters?: AttributeFilterParams, page?: number, limit?: number): Promise<ListResponseDto<AttributeDto>>;
  findById(id: number): Promise<AttributeDto | null>;
  delete(id: number): Promise<AttributeDto>;
}
