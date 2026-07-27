import { CartDto } from '@/dtos/cart.dto';
import Response from '@/dtos/Response';
import { AddToCartModel, UpdateCartItemModel } from '@/models/cart.model';
import { AxiosResponse } from 'axios';

export default interface ICartService {
  /** The caller's active cart. `data` is null when no cart exists yet. */
  getActive(userId?: string | null): Promise<AxiosResponse<Response<CartDto | null>>>;

  /** Adds products, creating the cart when needed. */
  addProducts(model: AddToCartModel): Promise<AxiosResponse<Response<CartDto>>>;

  /** Sets an absolute quantity for a product. 0 removes it. */
  updateQuantity(productId: number, model: UpdateCartItemModel): Promise<AxiosResponse<Response<CartDto>>>;

  removeProduct(productId: number, userId?: string | null): Promise<AxiosResponse<Response<CartDto>>>;

  /** Empties the cart but keeps it usable. */
  clear(userId?: string | null): Promise<AxiosResponse<Response<CartDto>>>;
}
