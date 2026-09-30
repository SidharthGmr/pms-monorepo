import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import Response from '@/dtos/Response';
import { AddToCartModel, CartDto, UpdateCartItemModel } from '@pms/types';
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

  getActive(): Promise<AxiosResponse<Response<CartDto | null>>> {
    return this.httpService.call().get<CartDto | null, AxiosResponse<Response<CartDto | null>>>('/carts/active');
  }

  addProducts(model: AddToCartModel): Promise<AxiosResponse<Response<CartDto>>> {
    return this.httpService.call().post<CartDto, AxiosResponse<Response<CartDto>>>('/carts', model);
  }

  updateVariantQuantity(variantId: number, model: UpdateCartItemModel): Promise<AxiosResponse<Response<CartDto>>> {
    return this.httpService.call().put<CartDto, AxiosResponse<Response<CartDto>>>(`/carts/variants/${variantId}`, model);
  }

  removeVariant(variantId: number): Promise<AxiosResponse<Response<CartDto>>> {
    return this.httpService.call().delete<CartDto, AxiosResponse<Response<CartDto>>>(`/carts/variants/${variantId}`);
  }

  updateQuantity(productId: number, model: UpdateCartItemModel): Promise<AxiosResponse<Response<CartDto>>> {
    return this.httpService.call().put<CartDto, AxiosResponse<Response<CartDto>>>(`/carts/items/${productId}`, model);
  }

  removeProduct(productId: number): Promise<AxiosResponse<Response<CartDto>>> {
    return this.httpService.call().delete<CartDto, AxiosResponse<Response<CartDto>>>(`/carts/items/${productId}`);
  }

  clear(): Promise<AxiosResponse<Response<CartDto>>> {
    return this.httpService.call().delete<CartDto, AxiosResponse<Response<CartDto>>>('/carts');
  }
}
