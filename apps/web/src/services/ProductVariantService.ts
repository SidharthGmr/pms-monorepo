import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import IProductVariantService from './interfaces/IProductVariantService';
import { ProductVariantDto, ProductVariantListItemDto } from '@/dtos/product-variant.dto';
// The single-variant read is typed from the shared package: the local ProductVariantListItemDto
// above still declares columns the API no longer returns (effectiveFrom, storeCode, productId).
import { ProductVariantListItemDto as VariantDetailDto } from '@pms/types';
import { CreateProductVariantModel, UpdateProductVariantModel } from '@/models/product-variant.model';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import Response from '@/dtos/Response';

@injectable()
export default class ProductVariantService implements IProductVariantService {
    private readonly httpService: IHttpService;

    constructor(
        httpService = container.get<IHttpService>(TYPES.IHttpService)
    ) {
        this.httpService = httpService;
    }

    getById(id: number | string): Promise<AxiosResponse<Response<VariantDetailDto>>> {
        return this.httpService
            .call()
            .get<VariantDetailDto, AxiosResponse<Response<VariantDetailDto>>>(`/product-variants/${id}`);
    }

    create(model: CreateProductVariantModel): Promise<AxiosResponse<Response<ProductVariantDto>>> {
        return this.httpService
            .call()
            .post<ProductVariantDto, AxiosResponse<Response<ProductVariantDto>>>('/product-variants', model);
    }

    update(id: number, model: UpdateProductVariantModel): Promise<AxiosResponse<Response<ProductVariantDto>>> {
        return this.httpService
            .call()
            .put<ProductVariantDto, AxiosResponse<Response<ProductVariantDto>>>(`/product-variants/${id}`, model);
    }

    getAllPublic(params?: ProductVariantFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductVariantListItemDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<ProductVariantListItemDto>, AxiosResponse<Response<ListResponseDto<ProductVariantListItemDto>>>>(
                '/product-variants/public',
                { params }
            );
    }

    getAll(params?: ProductVariantFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductVariantListItemDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<ProductVariantListItemDto>, AxiosResponse<Response<ListResponseDto<ProductVariantListItemDto>>>>(
                '/product-variants',
                { params }
            );
    }

    getByProductId(
        productId: number | string,
        params?: { page?: number; recordPerPage?: number }
    ): Promise<AxiosResponse<Response<ListResponseDto<ProductVariantDto>>>> {
        return this.httpService
            .call()
            .get<ListResponseDto<ProductVariantDto>, AxiosResponse<Response<ListResponseDto<ProductVariantDto>>>>(
                `/product-variants/product/${productId}`,
                { params }
            );
    }

    getEffective(productId: number | string, date?: string): Promise<AxiosResponse<Response<ProductVariantDto>>> {
        return this.httpService
            .call()
            .get<ProductVariantDto, AxiosResponse<Response<ProductVariantDto>>>(
                `/product-variants/product/${productId}/effective`,
                { params: date ? { date } : undefined }
            );
    }
}
