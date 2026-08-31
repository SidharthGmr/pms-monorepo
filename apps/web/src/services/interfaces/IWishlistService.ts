import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { WishlistDto, WishlistHasDto } from '@/dtos/wishlist.dto';
import { WishlistFilterParams } from '@/params/wishlist.params';
import { AxiosResponse } from 'axios';

export default interface IWishlistService {
  add(productId: number): Promise<AxiosResponse<Response<WishlistDto>>>;
  getAll(params?: WishlistFilterParams): Promise<AxiosResponse<Response<ListResponseDto<WishlistDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<WishlistDto>>>;
  has(productId: number | string): Promise<AxiosResponse<Response<WishlistHasDto>>>;
  remove(id: number | string): Promise<AxiosResponse<Response<void>>>;
  removeByProduct(productId: number | string): Promise<AxiosResponse<Response<void>>>;
}
