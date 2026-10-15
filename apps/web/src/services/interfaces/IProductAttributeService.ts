import { AxiosResponse } from 'axios';
import { ProductAttributeDto } from '@/dtos/product-attribute.dto';
import { CreateProductAttributeModel, UpdateProductAttributeModel } from '@/models/product-attribute.model';
import { ProductAttributeFilterParams } from '@/params/product.params';
import { CustomResponse as Response, ListResponseDto } from '@pms/types';

export default interface IProductAttributeService {
    getAll(params?: ProductAttributeFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductAttributeDto>>>>;
    create(model: CreateProductAttributeModel): Promise<AxiosResponse<Response<ProductAttributeDto>>>;
    getByProductId(productId: number | string): Promise<AxiosResponse<Response<ProductAttributeDto[]>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<ProductAttributeDto>>>;
    update(id: number | string, model: UpdateProductAttributeModel): Promise<AxiosResponse<Response<ProductAttributeDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
