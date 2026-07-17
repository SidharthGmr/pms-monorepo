import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import ISupplierService from './interfaces/ISupplierService';
import { SupplierDto } from '@/dtos/supplier.dto';
import { CreateSupplierModel } from '@/models/supplier.model';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { SupplierFilterParams } from '@/params/supplier.params';
import Response from '@/dtos/Response';

@injectable()
export default class SupplierService implements ISupplierService {
    private readonly httpService: IHttpService;

    constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
        this.httpService = httpService;
    }

    create(model: CreateSupplierModel): Promise<AxiosResponse<Response<SupplierDto>>> {
        return this.httpService
            .call()
            .post<SupplierDto, AxiosResponse<Response<SupplierDto>>>('/suppliers', model);
    }

    getAll(params?: SupplierFilterParams): Promise<AxiosResponse<Response<ListResponseDto<SupplierDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<SupplierDto>, AxiosResponse<Response<ListResponseDto<SupplierDto>>>>('/suppliers', { params });
    }

    getById(id: number | string): Promise<AxiosResponse<Response<SupplierDto>>> {
        return this.httpService
            .call()
            .get<SupplierDto, AxiosResponse<Response<SupplierDto>>>(`/suppliers/${id}`);
    }

    update(id: number | string, model: CreateSupplierModel): Promise<AxiosResponse<Response<SupplierDto>>> {
        return this.httpService
            .call()
            .put<SupplierDto, AxiosResponse<Response<SupplierDto>>>(`/suppliers/${id}`, model);
    }

    delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
        return this.httpService
            .call()
            .delete<void, AxiosResponse<Response<void>>>(`/suppliers/${id}`);
    }
}
