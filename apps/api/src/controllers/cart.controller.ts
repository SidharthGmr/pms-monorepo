import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { AddToCartCommand, CartDto, UpdateCartItemCommand } from '@pms/types';
import CustomResponse from '../dtos/custom-response';
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
   * The cart always belongs to the signed-in caller. The owner is taken from the verified
   * JWT only - never from the body or query string - otherwise any authenticated user
   * could read, edit or clear another user's cart by passing their userId.
   */
  private ownerFrom(req: Request, storeId: number): CartOwner {
    return { storeId, userId: req.user?.userId ?? null, sessionToken: null };
  }

  getActive = async (req: Request, res: Response): Promise<Response<CustomResponse<CartDto | null>>> => {
    const { storeId, error } = await this.resolveStoreId(req);
    if (error || storeId === undefined) return res.status(400).json({ success: false, message: error });

    const cart = await this.unitOfService.Cart.getActive(this.ownerFrom(req, storeId));
    return res.status(200).json({ success: true, message: 'Cart fetched successfully', data: cart });
  };

  addProducts = async (req: Request, res: Response): Promise<Response<CustomResponse<CartDto>>> => {
    const body = req.body as { storeId?: number; productIds?: unknown; variantIds?: unknown; currency?: string };

    const { storeId, error } = await this.resolveStoreId(req, body.storeId);
    if (error || storeId === undefined) return res.status(400).json({ success: false, message: error });

    // A storefront sends the SKU the shopper picked; the POS still sends products and lets
    // the service resolve the default variant. Either is valid, but one must be present.
    const variantIds = Array.isArray(body.variantIds) ? body.variantIds.map(Number) : undefined;
    const productIds = Array.isArray(body.productIds) ? body.productIds.map(Number) : undefined;

    if (!variantIds?.length && !productIds?.length) {
      return res.status(400).json({ success: false, message: 'Send variantIds (preferred) or productIds as a non-empty array.' });
    }

    const owner = this.ownerFrom(req, storeId);
    const model: AddToCartCommand = {
      storeId,
      userId: owner.userId,
      sessionToken: owner.sessionToken,
      productIds: productIds ?? [],
      ...(variantIds?.length && { variantIds }),
      ...(body.currency && { currency: body.currency }),
    };

    const cart = await this.unitOfService.Cart.addProducts(model);
    return res.status(201).json({ success: true, message: 'Products added to cart successfully', data: cart });
  };

  updateQuantity = async (req: Request, res: Response): Promise<Response<CustomResponse<CartDto>>> => {
    const productId = parseInt(req.params['productId'] as string);
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid product id' });

    const body = req.body as { storeId?: number; quantity?: number };

    const { storeId, error } = await this.resolveStoreId(req, body.storeId);
    if (error || storeId === undefined) return res.status(400).json({ success: false, message: error });

    if (body.quantity === undefined) {
      return res.status(400).json({ success: false, message: 'quantity is required.' });
    }

    const owner = this.ownerFrom(req, storeId);
    const model: UpdateCartItemCommand = {
      storeId,
      userId: owner.userId,
      sessionToken: owner.sessionToken,
      quantity: Number(body.quantity),
    };

    const cart = await this.unitOfService.Cart.updateProductQuantity(productId, model);
    return res.status(200).json({ success: true, message: 'Cart updated successfully', data: cart });
  };

  updateVariantQuantity = async (req: Request, res: Response): Promise<Response<CustomResponse<CartDto>>> => {
    const variantId = parseInt(req.params['variantId'] as string);
    if (isNaN(variantId)) return res.status(400).json({ success: false, message: 'Invalid variant id' });

    const body = req.body as { storeId?: number; quantity?: number };

    const { storeId, error } = await this.resolveStoreId(req, body.storeId);
    if (error || storeId === undefined) return res.status(400).json({ success: false, message: error });

    if (body.quantity === undefined) {
      return res.status(400).json({ success: false, message: 'quantity is required.' });
    }

    const owner = this.ownerFrom(req, storeId);
    const cart = await this.unitOfService.Cart.setVariantQuantity(variantId, {
      storeId,
      userId: owner.userId,
      sessionToken: owner.sessionToken,
      quantity: Number(body.quantity),
    });
    return res.status(200).json({ success: true, message: 'Cart updated successfully', data: cart });
  };

  removeVariant = async (req: Request, res: Response): Promise<Response<CustomResponse<CartDto>>> => {
    const variantId = parseInt(req.params['variantId'] as string);
    if (isNaN(variantId)) return res.status(400).json({ success: false, message: 'Invalid variant id' });

    const { storeId, error } = await this.resolveStoreId(req);
    if (error || storeId === undefined) return res.status(400).json({ success: false, message: error });

    const cart = await this.unitOfService.Cart.removeVariant(variantId, this.ownerFrom(req, storeId));
    return res.status(200).json({ success: true, message: 'Item removed from cart successfully', data: cart });
  };

  removeProduct = async (req: Request, res: Response): Promise<Response<CustomResponse<CartDto>>> => {
    const productId = parseInt(req.params['productId'] as string);
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid product id' });

    const { storeId, error } = await this.resolveStoreId(req);
    if (error || storeId === undefined) return res.status(400).json({ success: false, message: error });

    const cart = await this.unitOfService.Cart.removeProduct(productId, this.ownerFrom(req, storeId));
    return res.status(200).json({ success: true, message: 'Product removed from cart successfully', data: cart });
  };

  clear = async (req: Request, res: Response): Promise<Response<CustomResponse<CartDto>>> => {
    const { storeId, error } = await this.resolveStoreId(req);
    if (error || storeId === undefined) return res.status(400).json({ success: false, message: error });

    const cart = await this.unitOfService.Cart.clear(this.ownerFrom(req, storeId));
    return res.status(200).json({ success: true, message: 'Cart cleared successfully', data: cart });
  };
}
