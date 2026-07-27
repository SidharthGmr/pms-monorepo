import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { CartDto } from '../dtos/cart.dto';
import CustomResponse from '../dtos/custom-response';
import { AddToCartModel, UpdateCartItemModel } from '../models/cart.model';
import { CartOwner } from '../repository/interfaces/icart.repository';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class CartController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  /**
   * Cart relates to `store.id` while the JWT carries `storeCode`, so resolve one
   * to the other. A storeId supplied in the body is honoured only when it
   * matches the caller's own store - otherwise it would be a way to write into
   * another tenant's cart.
   */
  private async resolveStoreId(req: Request, bodyStoreId?: number): Promise<{ storeId?: number; error?: string }> {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return { error: 'Store code not found. User must be associated with a store.' };

    const store = await this.unitOfService.Store.getByCode(storeCode);
    if (!store) return { error: `No store found for code ${storeCode}.` };

    if (bodyStoreId !== undefined && bodyStoreId !== store.id) {
      return { error: 'storeId does not match the store you are signed in to.' };
    }

    return { storeId: store.id };
  }

  /**
   * A staff member operating the POS may build a cart on a customer's behalf, so
   * an explicit userId in the request wins; otherwise the cart belongs to the
   * caller. sessionToken supports guest carts.
   */
  private ownerFrom(req: Request, storeId: number, userId?: string | null): CartOwner {
    const sessionToken = (req.header('x-cart-session') || (req.query['sessionToken'] as string) || null) as string | null;
    const resolvedUserId = userId ?? (req.user?.userId as string | undefined) ?? null;
    return { storeId, userId: resolvedUserId, sessionToken: resolvedUserId ? null : sessionToken };
  }

  getActive = async (req: Request, res: Response): Promise<Response<CustomResponse<CartDto | null>>> => {
    const { storeId, error } = await this.resolveStoreId(req);
    if (error || storeId === undefined) return res.status(400).json({ success: false, message: error });

    const userId = (req.query['userId'] as string) || undefined;
    const cart = await this.unitOfService.Cart.getActive(this.ownerFrom(req, storeId, userId));
    return res.status(200).json({ success: true, message: 'Cart fetched successfully', data: cart });
  };

  addProducts = async (req: Request, res: Response): Promise<Response<CustomResponse<CartDto>>> => {
    const body = req.body as { storeId?: number; userId?: string | null; productIds?: unknown; currency?: string };

    const { storeId, error } = await this.resolveStoreId(req, body.storeId);
    if (error || storeId === undefined) return res.status(400).json({ success: false, message: error });

    if (!Array.isArray(body.productIds)) {
      return res.status(400).json({ success: false, message: 'productIds must be an array of product ids.' });
    }

    const owner = this.ownerFrom(req, storeId, body.userId);
    const model: AddToCartModel = {
      storeId,
      userId: owner.userId,
      sessionToken: owner.sessionToken,
      productIds: body.productIds.map(Number),
      ...(body.currency && { currency: body.currency }),
    };

    const cart = await this.unitOfService.Cart.addProducts(model);
    return res.status(201).json({ success: true, message: 'Products added to cart successfully', data: cart });
  };

  updateQuantity = async (req: Request, res: Response): Promise<Response<CustomResponse<CartDto>>> => {
    const productId = parseInt(req.params['productId'] as string);
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid product id' });

    const body = req.body as { storeId?: number; userId?: string | null; quantity?: number };

    const { storeId, error } = await this.resolveStoreId(req, body.storeId);
    if (error || storeId === undefined) return res.status(400).json({ success: false, message: error });

    if (body.quantity === undefined) {
      return res.status(400).json({ success: false, message: 'quantity is required.' });
    }

    const owner = this.ownerFrom(req, storeId, body.userId);
    const model: UpdateCartItemModel = {
      storeId,
      userId: owner.userId,
      sessionToken: owner.sessionToken,
      quantity: Number(body.quantity),
    };

    const cart = await this.unitOfService.Cart.updateProductQuantity(productId, model);
    return res.status(200).json({ success: true, message: 'Cart updated successfully', data: cart });
  };

  removeProduct = async (req: Request, res: Response): Promise<Response<CustomResponse<CartDto>>> => {
    const productId = parseInt(req.params['productId'] as string);
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid product id' });

    const { storeId, error } = await this.resolveStoreId(req);
    if (error || storeId === undefined) return res.status(400).json({ success: false, message: error });

    const userId = (req.query['userId'] as string) || undefined;
    const cart = await this.unitOfService.Cart.removeProduct(productId, this.ownerFrom(req, storeId, userId));
    return res.status(200).json({ success: true, message: 'Product removed from cart successfully', data: cart });
  };

  clear = async (req: Request, res: Response): Promise<Response<CustomResponse<CartDto>>> => {
    const { storeId, error } = await this.resolveStoreId(req);
    if (error || storeId === undefined) return res.status(400).json({ success: false, message: error });

    const userId = (req.query['userId'] as string) || undefined;
    const cart = await this.unitOfService.Cart.clear(this.ownerFrom(req, storeId, userId));
    return res.status(200).json({ success: true, message: 'Cart cleared successfully', data: cart });
  };
}
