import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import IBrandNameService from './interfaces/IBrandNameService';
import { BrandNameDto } from '@/dtos/brand-name.dto';
import { CreateBrandNameModel  } from '@/models/brand-name.model';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { BrandNameFilterParams } from '@/params/brand-name.params';
import Response from '@/dtos/Response';

@injectable()
export default class BrandNameService implements IBrandNameService {
    private readonly httpService: IHttpService;

    constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
        this.httpService = httpService;
    }

    create(model: CreateBrandNameModel): Promise<AxiosResponse<Response<BrandNameDto>>> {
        return this.httpService
            .call()
            .post<BrandNameDto, AxiosResponse<Response<BrandNameDto>>>('/brand-names', model);
    }

    getAll(params?: BrandNameFilterParams): Promise<AxiosResponse<Response<ListResponseDto<BrandNameDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<BrandNameDto>, AxiosResponse<Response<ListResponseDto<BrandNameDto>>>>('/brand-names', { params });
    }

    getById(id: number | string): Promise<AxiosResponse<Response<BrandNameDto>>> {
        return this.httpService
            .call()
            .get<BrandNameDto, AxiosResponse<Response<BrandNameDto>>>(`/brand-names/${id}`);
    }

    update(id: number | string, model: CreateBrandNameModel): Promise<AxiosResponse<Response<BrandNameDto>>> {
        return this.httpService
            .call()
            .put<BrandNameDto, AxiosResponse<Response<BrandNameDto>>>(`/brand-names/${id}`, model);
    }

    delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
        return this.httpService
            .call()
            .delete<void, AxiosResponse<Response<void>>>(`/brand-names/${id}`);
    }
}
