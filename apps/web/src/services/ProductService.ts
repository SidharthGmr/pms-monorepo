import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import IProductService, { AddStockModel } from './interfaces/IProductService';
import { ProductDto } from '@/dtos/product.dto';
import { CreateProductModel, UpdateProductModel } from '@/models/product.model';
import { ProductFilterParams } from '@/params/product.params';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

@injectable()
export default class ProductService implements IProductService {
    private readonly httpService: IHttpService;

    constructor(
        httpService = container.get<IHttpService>(TYPES.IHttpService)
    ) {
        this.httpService = httpService;
    }

    create(model: CreateProductModel): Promise<AxiosResponse<Response<ProductDto>>> {
        return this.httpService
            .call()
            .post<ProductDto, AxiosResponse<Response<ProductDto>>>('/products', model);
    }

    getAll(params?: ProductFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<ProductDto>, AxiosResponse<Response<ListResponseDto<ProductDto>>>>('/products', { params });
    }

    // Public catalog endpoint — no authentication needed (only returns published products).
    getAllPublic(params?: ProductFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<ProductDto>, AxiosResponse<Response<ListResponseDto<ProductDto>>>>('/products/public', { params });
    }

    getById(id: number | string): Promise<AxiosResponse<Response<ProductDto>>> {
        return this.httpService
            .call()
            .get<ProductDto, AxiosResponse<Response<ProductDto>>>(`/products/${id}`);
    }

    update(id: number | string, model: UpdateProductModel): Promise<AxiosResponse<Response<ProductDto>>> {
        return this.httpService
            .call()
            .put<ProductDto, AxiosResponse<Response<ProductDto>>>(`/products/${id}`, model);
    }

    getLowStock(params?: ProductFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<ProductDto>, AxiosResponse<Response<ListResponseDto<ProductDto>>>>('/products/reports/low-stock', { params });
    }

    addStock(id: number | string, model: AddStockModel): Promise<AxiosResponse<Response<ProductDto>>> {
        return this.httpService
            .call()
            .patch<ProductDto, AxiosResponse<Response<ProductDto>>>(`/products/${id}/stock`, model);
    }

    getStockHistory(id: number | string, params?: { page?: number, recordPerPage?: number }): Promise<AxiosResponse<Response<ListResponseDto<any>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<any>, AxiosResponse<Response<ListResponseDto<any>>>>(`/products/${id}/stock-history`, { params });
    }

    delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
        return this.httpService
            .call()
            .delete<void, AxiosResponse<Response<void>>>(`/products/${id}`);
    }
}
