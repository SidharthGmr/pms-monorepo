import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { WishlistDto, WishlistHasDto } from '@/dtos/wishlist.dto';
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

  add(productId: number): Promise<AxiosResponse<Response<WishlistDto>>> {
    const model: CreateWishlistModel = { productId };
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

  has(productId: number | string): Promise<AxiosResponse<Response<WishlistHasDto>>> {
    return this.httpService.call().get<WishlistHasDto, AxiosResponse<Response<WishlistHasDto>>>(`/wishlists/has/${productId}`);
  }

  remove(id: number | string): Promise<AxiosResponse<Response<void>>> {
    return this.httpService.call().delete<void, AxiosResponse<Response<void>>>(`/wishlists/${id}`);
  }

  removeByProduct(productId: number | string): Promise<AxiosResponse<Response<void>>> {
    return this.httpService.call().delete<void, AxiosResponse<Response<void>>>(`/wishlists/product/${productId}`);
  }
}
