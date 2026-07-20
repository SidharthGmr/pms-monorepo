import { AxiosResponse } from 'axios';
import { CategoryDto } from '@/dtos/category.dto';
import { CreateCategoryModel, UpdateCategoryModel } from '@/models/category.model';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { CategoryFilterParams } from '@pms/types';

export default interface ICategoryService {
    create(model: CreateCategoryModel): Promise<AxiosResponse<Response<CategoryDto>>>;
    getAll(params?: CategoryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<CategoryDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<CategoryDto>>>;
    update(id: number | string, model: UpdateCategoryModel): Promise<AxiosResponse<Response<CategoryDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
