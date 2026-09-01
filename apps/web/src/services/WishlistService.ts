import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { WishlistDto, WishlistHasDto, WishlistVariantHasDto } from '@/dtos/wishlist.dto';
import { CreateWishlistModel } from '@/models/wishlist.model';
import { WishlistFilterParams } from '@/params/wishlist.params';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IWishlistService from './interfaces/IWishlistService';

@injectable()
export default class WishlistService implements IWishlistService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  add(variantId: number): Promise<AxiosResponse<Response<WishlistDto>>> {
    const model: CreateWishlistModel = { variantId };
    return this.httpService.call().post<WishlistDto, AxiosResponse<Response<WishlistDto>>>('/wishlists', model);
  }

  getAll(params?: WishlistFilterParams): Promise<AxiosResponse<Response<ListResponseDto<WishlistDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<WishlistDto>, AxiosResponse<Response<ListResponseDto<WishlistDto>>>>('/wishlists', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<WishlistDto>>> {
    return this.httpService.call().get<WishlistDto, AxiosResponse<Response<WishlistDto>>>(`/wishlists/${id}`);
  }

  has(productId: number | string, variantId?: number): Promise<AxiosResponse<Response<WishlistHasDto>>> {
    return this.httpService.call().get<WishlistHasDto, AxiosResponse<Response<WishlistHasDto>>>(`/wishlists/has/${productId}`, {
      ...(variantId !== undefined && { params: { variantId } }),
    });
  }

  hasVariant(variantId: number): Promise<AxiosResponse<Response<WishlistVariantHasDto>>> {
    return this.httpService
      .call()
      .get<WishlistVariantHasDto, AxiosResponse<Response<WishlistVariantHasDto>>>(`/wishlists/has/variant/${variantId}`);
  }

  remove(id: number | string): Promise<AxiosResponse<Response<void>>> {
    return this.httpService.call().delete<void, AxiosResponse<Response<void>>>(`/wishlists/${id}`);
  }

  removeByProduct(productId: number | string, variantId?: number): Promise<AxiosResponse<Response<void>>> {
    return this.httpService.call().delete<void, AxiosResponse<Response<void>>>(`/wishlists/product/${productId}`, {
      ...(variantId !== undefined && { params: { variantId } }),
    });
  }

  removeByVariant(variantId: number | string): Promise<AxiosResponse<Response<WishlistVariantHasDto>>> {
    return this.httpService.call().delete<WishlistVariantHasDto, AxiosResponse<Response<WishlistVariantHasDto>>>(`/wishlists/variant/${variantId}`);
  }
}
