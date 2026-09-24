import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import ICategoryService from './interfaces/ICategoryService';
import { CategoryModel, CategoryResponseDto } from '@pms/types';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { CategoryFilterParams } from '@pms/types';

@injectable()
export default class CategoryService implements ICategoryService {
    private readonly httpService: IHttpService;

    constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
        this.httpService = httpService;
    }

    create(model: CategoryModel): Promise<AxiosResponse<Response<CategoryResponseDto>>> {
        return this.httpService
            .call()
            .post<CategoryResponseDto, AxiosResponse<Response<CategoryResponseDto>>>('/categories', model);
    }

    getAll(params?: CategoryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<CategoryResponseDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<CategoryResponseDto>, AxiosResponse<Response<ListResponseDto<CategoryResponseDto>>>>('/categories', { params });
    }

    getById(id: number | string): Promise<AxiosResponse<Response<CategoryResponseDto>>> {
        return this.httpService
            .call()
            .get<CategoryResponseDto, AxiosResponse<Response<CategoryResponseDto>>>(`/categories/${id}`);
    }

    update(id: number | string, model: Partial<CategoryModel>): Promise<AxiosResponse<Response<CategoryResponseDto>>> {
        return this.httpService
            .call()
            .put<CategoryResponseDto, AxiosResponse<Response<CategoryResponseDto>>>(`/categories/${id}`, model);
    }

    delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
        return this.httpService
            .call()
            .delete<void, AxiosResponse<Response<void>>>(`/categories/${id}`);
    }
}
