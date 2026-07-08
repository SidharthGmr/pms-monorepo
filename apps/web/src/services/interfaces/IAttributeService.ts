import { AxiosResponse } from 'axios';
import { AttributeDto } from '@/dtos/attribute.dto';
import { CreateAttributeModel, UpdateAttributeModel } from '@/models/attribute.model';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { AttributeFilterParams } from '@/params/attribute.params';
import Response from '@/dtos/Response';

export default interface IAttributeService {
    create(model: CreateAttributeModel): Promise<AxiosResponse<Response<AttributeDto>>>;
    getAll(params?: AttributeFilterParams): Promise<AxiosResponse<Response<ListResponseDto<AttributeDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<AttributeDto>>>;
    update(id: number | string, model: UpdateAttributeModel): Promise<AxiosResponse<Response<AttributeDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
