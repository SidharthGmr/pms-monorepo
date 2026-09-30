import { AxiosResponse } from 'axios';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { AttributeDto, AttributeFilterParams, AttributeModel } from '@pms/types';

export default interface IAttributeService {
    create(model: AttributeModel): Promise<AxiosResponse<Response<AttributeDto>>>;
    getAll(params?: AttributeFilterParams): Promise<AxiosResponse<Response<ListResponseDto<AttributeDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<AttributeDto>>>;
    update(id: number | string, model: Partial<AttributeModel>): Promise<AxiosResponse<Response<AttributeDto>>>;
    /** Moves the attribute to Trash and returns it. 409 while products still use it. */
    delete(id: number | string): Promise<AxiosResponse<Response<AttributeDto>>>;
}
