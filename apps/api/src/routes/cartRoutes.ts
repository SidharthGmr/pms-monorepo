import { AddToCartValidator, UpdateCartItemValidator } from '@pms/types';
import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { CartController } from '../controllers/cart.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import { storeRequiredMiddleware } from '../middleware/store-required.middleware';
import { validate } from '../middleware/validate';

const cartRouter = Router();
const cartController = container.get<CartController>(TYPES.CartController);

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Shopping cart management. Items are addressed by productId; the
 *       API resolves each product to its currently effective ProductVariant.
 */

/**
 * @swagger
 * /carts/active:
 *   get:
 *     summary: Get the caller's active cart for their store
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: Build/read the cart on another user's behalf (POS). Defaults to the caller.
 *     responses:
 *       200:
 *         description: Cart fetched successfully (data is null when no active cart exists)
 *       400:
 *         description: Store code missing from the token
 */
cartRouter.get('/active', authenticateToken, storeRequiredMiddleware, asyncHandler(cartController.getActive));

/**
 * @swagger
 * /carts:
 *   post:
 *     summary: Add products to the active cart, creating the cart when needed
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productIds]
 *             properties:
 *               storeId:
 *                 type: integer
 *                 description: Optional. Must match the store the caller is signed in to.
 *               userId:
 *                 type: string
 *                 description: Optional. Cart owner; defaults to the caller.
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: A repeated id increases quantity, so [4, 4] adds 2 of product 4.
 *               currency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Products added to cart successfully
 *       400:
 *         description: Invalid payload, or a product has no active price
 */
cartRouter.post('/', authenticateToken, storeRequiredMiddleware, validate(AddToCartValidator), asyncHandler(cartController.addProducts));

/**
 * @swagger
 * /carts/items/{productId}:
 *   put:
 *     summary: Set an absolute quantity for a product in the cart (0 removes it)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *       404:
 *         description: No active cart found
 */
cartRouter.put(
  '/items/:productId',
  authenticateToken,
  storeRequiredMiddleware,
  validate(UpdateCartItemValidator),
  asyncHandler(cartController.updateQuantity)
);

/**
 * @swagger
 * /carts/items/{productId}:
 *   delete:
 *     summary: Remove a product from the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product removed from cart successfully
 *       404:
 *         description: No active cart found
 */
cartRouter.delete('/items/:productId', authenticateToken, storeRequiredMiddleware, asyncHandler(cartController.removeProduct));

/**
 * @swagger
 * /carts:
 *   delete:
 *     summary: Empty the active cart without deleting it
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       404:
 *         description: No active cart found
 */
/** Variant-keyed lines: what a storefront cart actually holds. */
cartRouter.put(
  '/variants/:variantId',
  authenticateToken,
  storeRequiredMiddleware,
  validate(UpdateCartItemValidator),
  asyncHandler(cartController.updateVariantQuantity)
);
cartRouter.delete('/variants/:variantId', authenticateToken, storeRequiredMiddleware, asyncHandler(cartController.removeVariant));

cartRouter.delete('/', authenticateToken, storeRequiredMiddleware, asyncHandler(cartController.clear));

export default cartRouter;
