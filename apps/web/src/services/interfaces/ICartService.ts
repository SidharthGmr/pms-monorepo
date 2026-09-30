import Response from '@/dtos/Response';
import { AddToCartModel, CartDto, UpdateCartItemModel } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface ICartService {
  /** The signed-in caller's active cart. `data` is null when no cart exists yet. */
  getActive(): Promise<AxiosResponse<Response<CartDto | null>>>;

  /** Adds products, creating the cart when needed. */
  addProducts(model: AddToCartModel): Promise<AxiosResponse<Response<CartDto>>>;

  /** Sets an absolute quantity for a product. 0 removes it. */
  updateVariantQuantity(variantId: number, model: UpdateCartItemModel): Promise<AxiosResponse<Response<CartDto>>>;

  removeVariant(variantId: number): Promise<AxiosResponse<Response<CartDto>>>;

  updateQuantity(productId: number, model: UpdateCartItemModel): Promise<AxiosResponse<Response<CartDto>>>;

  removeProduct(productId: number): Promise<AxiosResponse<Response<CartDto>>>;

  /** Empties the cart but keeps it usable. */
  clear(): Promise<AxiosResponse<Response<CartDto>>>;
}
