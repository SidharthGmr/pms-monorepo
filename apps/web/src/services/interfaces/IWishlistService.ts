import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { WishlistDto, WishlistHasDto, WishlistVariantHasDto } from '@/dtos/wishlist.dto';
import { WishlistFilterParams } from '@/params/wishlist.params';
import { AxiosResponse } from 'axios';

export default interface IWishlistService {
  /** `variantId` pins one SKU; omit it to save the product itself. */
  add(productId: number, variantId?: number): Promise<AxiosResponse<Response<WishlistDto>>>;
  getAll(params?: WishlistFilterParams): Promise<AxiosResponse<Response<ListResponseDto<WishlistDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<WishlistDto>>>;
  /** Without `variantId` this reports the product-level save, not "any SKU of this product". */
  has(productId: number | string, variantId?: number): Promise<AxiosResponse<Response<WishlistHasDto>>>;
  /** For a grid that rendered SKUs and has no parent product id to hand. */
  hasVariant(variantId: number | string): Promise<AxiosResponse<Response<WishlistVariantHasDto>>>;
  remove(id: number | string): Promise<AxiosResponse<Response<void>>>;
  removeByProduct(productId: number | string, variantId?: number): Promise<AxiosResponse<Response<void>>>;
  removeByVariant(variantId: number | string): Promise<AxiosResponse<Response<void>>>;
}
