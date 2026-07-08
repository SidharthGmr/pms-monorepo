import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import ICategoryService from './interfaces/ICategoryService';
import { CategoryDto } from '@/dtos/category.dto';
import { CreateCategoryModel, UpdateCategoryModel } from '@/models/category.model';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { CategoryFilterParams } from '@/params/category.params';

@injectable()
export default class CategoryService implements ICategoryService {
    private readonly httpService: IHttpService;

    constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
        this.httpService = httpService;
    }

    create(model: CreateCategoryModel): Promise<AxiosResponse<Response<CategoryDto>>> {
        return this.httpService
            .call()
            .post<CategoryDto, AxiosResponse<Response<CategoryDto>>>('/categories', model);
    }

    getAll(params?: CategoryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<CategoryDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<CategoryDto>, AxiosResponse<Response<ListResponseDto<CategoryDto>>>>('/categories',{ params });
    }

    getById(id: number | string): Promise<AxiosResponse<Response<CategoryDto>>> {
        return this.httpService
            .call()
            .get<CategoryDto, AxiosResponse<Response<CategoryDto>>>(`/categories/${id}`);
    }

    update(id: number | string, model: UpdateCategoryModel): Promise<AxiosResponse<Response<CategoryDto>>> {
        return this.httpService
            .call()
            .put<CategoryDto, AxiosResponse<Response<CategoryDto>>>(`/categories/${id}`, model);
    }

    delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
        return this.httpService
            .call()
            .delete<void, AxiosResponse<Response<void>>>(`/categories/${id}`);
    }
}
