import { CartDto } from '../../dtos/cart.dto';
import { AddToCartModel, UpdateCartItemModel } from '../../models/cart.model';
import { CartOwner } from '../../repository/interfaces/icart.repository';

export interface ICartService {
  /** The owner's ACTIVE cart for a store, or null when they have none yet. */
  getActive(owner: CartOwner): Promise<CartDto | null>;

  /**
   * Adds products to the owner's ACTIVE cart, creating the cart if needed.
   * Each productId is resolved to its currently effective variant; a product
   * with no priced variant is rejected rather than silently dropped.
   */
  addProducts(data: AddToCartModel): Promise<CartDto>;

  /** Sets an absolute quantity for a product's line. 0 removes it. */
  updateProductQuantity(productId: number, data: UpdateCartItemModel): Promise<CartDto>;

  removeProduct(productId: number, owner: CartOwner): Promise<CartDto>;

  /** Empties the cart but keeps it ACTIVE and reusable. */
  clear(owner: CartOwner): Promise<CartDto>;
}
