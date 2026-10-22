import { AxiosResponse } from 'axios';



import { CustomResponse as Response, ListResponseDto, ProductAttributeDto, CreateProductAttributeModel, UpdateProductAttributeModel, ProductAttributeFilterParams } from '@pms/types';
export default interface IProductAttributeService {
    getAll(params?: ProductAttributeFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductAttributeDto>>>>;
    create(model: CreateProductAttributeModel): Promise<AxiosResponse<Response<ProductAttributeDto>>>;
    getByProductId(productId: number | string): Promise<AxiosResponse<Response<ProductAttributeDto[]>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<ProductAttributeDto>>>;
    update(id: number | string, model: UpdateProductAttributeModel): Promise<AxiosResponse<Response<ProductAttributeDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
