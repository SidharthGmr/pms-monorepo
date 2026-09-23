import { AxiosResponse } from 'axios';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { AttributeFilterParams } from '@/params/attribute.params';
import Response from '@/dtos/Response';
import { AttributeDto, AttributeModel } from '@pms/types';

export default interface IAttributeService {
    create(model: AttributeModel): Promise<AxiosResponse<Response<AttributeDto>>>;
    getAll(params?: AttributeFilterParams): Promise<AxiosResponse<Response<ListResponseDto<AttributeDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<AttributeDto>>>;
    update(id: number | string, model: AttributeModel): Promise<AxiosResponse<Response<AttributeDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
