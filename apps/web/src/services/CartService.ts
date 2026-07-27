import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CartDto } from '@/dtos/cart.dto';
import Response from '@/dtos/Response';
import { AddToCartModel, UpdateCartItemModel } from '@/models/cart.model';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import ICartService from './interfaces/ICartService';
import IHttpService from './interfaces/IHttpService';

@injectable()
export default class CartService implements ICartService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  getActive(userId?: string | null): Promise<AxiosResponse<Response<CartDto | null>>> {
    return this.httpService
      .call()
      .get<CartDto | null, AxiosResponse<Response<CartDto | null>>>('/carts/active', { params: userId ? { userId } : undefined });
  }

  addProducts(model: AddToCartModel): Promise<AxiosResponse<Response<CartDto>>> {
    return this.httpService.call().post<CartDto, AxiosResponse<Response<CartDto>>>('/carts', model);
  }

  updateQuantity(productId: number, model: UpdateCartItemModel): Promise<AxiosResponse<Response<CartDto>>> {
    return this.httpService.call().put<CartDto, AxiosResponse<Response<CartDto>>>(`/carts/items/${productId}`, model);
  }

  removeProduct(productId: number, userId?: string | null): Promise<AxiosResponse<Response<CartDto>>> {
    return this.httpService
      .call()
      .delete<CartDto, AxiosResponse<Response<CartDto>>>(`/carts/items/${productId}`, { params: userId ? { userId } : undefined });
  }

  clear(userId?: string | null): Promise<AxiosResponse<Response<CartDto>>> {
    return this.httpService.call().delete<CartDto, AxiosResponse<Response<CartDto>>>('/carts', { params: userId ? { userId } : undefined });
  }
}
