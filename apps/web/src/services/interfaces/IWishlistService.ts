import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { WishlistDto, WishlistHasDto } from '@/dtos/wishlist.dto';
import { WishlistFilterParams } from '@/params/wishlist.params';
import { AxiosResponse } from 'axios';

export default interface IWishlistService {
  /** Idempotent - re-adding a saved product returns the existing entry. */
  add(productId: number): Promise<AxiosResponse<Response<WishlistDto>>>;
  getAll(params?: WishlistFilterParams): Promise<AxiosResponse<Response<ListResponseDto<WishlistDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<WishlistDto>>>;
  /** Lets a product page render the filled/empty heart without fetching the list. */
  has(productId: number | string): Promise<AxiosResponse<Response<WishlistHasDto>>>;
  remove(id: number | string): Promise<AxiosResponse<Response<void>>>;
  /** For a toggle button, which knows the productId but not the row id. */
  removeByProduct(productId: number | string): Promise<AxiosResponse<Response<void>>>;
}
