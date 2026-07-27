import { AxiosResponse } from 'axios';
import { ProductVariantDto } from '@/dtos/product-variant.dto';
import { CreateProductVariantModel } from '@/models/product-variant.model';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

export default interface IProductVariantService {
    /** Records a new variant; the previously active one is deactivated by the API. */
    create(model: CreateProductVariantModel): Promise<AxiosResponse<Response<ProductVariantDto>>>;

    /** Paginated variant history for a product, newest first. */
    getByProductId(
        productId: number | string,
        params?: { page?: number; recordPerPage?: number }
    ): Promise<AxiosResponse<Response<ListResponseDto<ProductVariantDto>>>>;

    /** The variant effective on a given date (defaults to now). */
    getEffective(productId: number | string, date?: string): Promise<AxiosResponse<Response<ProductVariantDto>>>;
}
