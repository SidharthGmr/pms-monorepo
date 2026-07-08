import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import IAttributeService from './interfaces/IAttributeService';
import { AttributeDto } from '@/dtos/attribute.dto';
import { CreateAttributeModel, UpdateAttributeModel } from '@/models/attribute.model';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { AttributeFilterParams } from '@/params/attribute.params';
import Response from '@/dtos/Response';

@injectable()
export default class AttributeService implements IAttributeService {
    private readonly httpService: IHttpService;

    constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
        this.httpService = httpService;
    }

    create(model: CreateAttributeModel): Promise<AxiosResponse<Response<AttributeDto>>> {
        return this.httpService
            .call()
            .post<AttributeDto, AxiosResponse<Response<AttributeDto>>>('/attributes', model);
    }

    getAll(params?: AttributeFilterParams): Promise<AxiosResponse<Response<ListResponseDto<AttributeDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<AttributeDto>, AxiosResponse<Response<ListResponseDto<AttributeDto>>>>('/attributes', { params });
    }

    getById(id: number | string): Promise<AxiosResponse<Response<AttributeDto>>> {
        return this.httpService
            .call()
            .get<AttributeDto, AxiosResponse<Response<AttributeDto>>>(`/attributes/${id}`);
    }

    update(id: number | string, model: UpdateAttributeModel): Promise<AxiosResponse<Response<AttributeDto>>> {
        return this.httpService
            .call()
            .put<AttributeDto, AxiosResponse<Response<AttributeDto>>>(`/attributes/${id}`, model);
    }

    delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
        return this.httpService
            .call()
            .delete<void, AxiosResponse<Response<void>>>(`/attributes/${id}`);
    }
}
