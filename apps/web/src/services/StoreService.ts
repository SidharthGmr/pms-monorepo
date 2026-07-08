import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import IStoreService from './interfaces/IStoreService';
import { StoreDto } from '@/dtos/store.dto';
import { CreateStoreModel, UpdateStoreModel } from '@/models/store.model';
import { StoreFilterParams } from '@/params/store.params';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

@injectable()
export default class StoreService implements IStoreService {
    private readonly httpService: IHttpService;

    constructor(
        httpService = container.get<IHttpService>(TYPES.IHttpService)
    ) {
        this.httpService = httpService;
    }

    create(model: CreateStoreModel): Promise<AxiosResponse<Response<StoreDto>>> {
        return this.httpService
            .call()
            .post<StoreDto, AxiosResponse<Response<StoreDto>>>('/stores', model);
    }

    getAll(params?: StoreFilterParams): Promise<AxiosResponse<Response<ListResponseDto<StoreDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<StoreDto>, AxiosResponse<Response<ListResponseDto<StoreDto>>>>('/stores', { params });
    }

    getById(id: number | string): Promise<AxiosResponse<Response<StoreDto>>> {
        return this.httpService
            .call()
            .get<StoreDto, AxiosResponse<Response<StoreDto>>>(`/stores/${id}`);
    }

    update(id: number | string, model: UpdateStoreModel): Promise<AxiosResponse<Response<StoreDto>>> {
        return this.httpService
            .call()
            .put<StoreDto, AxiosResponse<Response<StoreDto>>>(`/stores/${id}`, model);
    }

    delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
        return this.httpService
            .call()
            .delete<void, AxiosResponse<Response<void>>>(`/stores/${id}`);
    }
}
