import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { WishlistController } from "../controllers/wishlist.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";
import { createWishlistSchema } from "../schemas/wishlistSchema";

const wishlistRouter = Router();
const wishlistController = container.get<WishlistController>(TYPES.WishlistController);

/**
 * @swagger
 * tags:
 *   - name: Wishlist
 *     description: Saved products. Every route is scoped to the signed-in user.
 */

/**
 * @swagger
 * /wishlists:
 *   get:
 *     summary: Get the signed-in user's wishlist (staff may pass userId)
 *     tags: [Wishlist]
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
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Matches the saved product's name
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: string
 *         description: A SKU id narrows to that variant; the literal `null` returns product-level saves only
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Staff only - ignored for customers, who are pinned to their own list
 *       - in: query
 *         name: showAllRecords
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [addedAt, productId]
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Wishlist fetched successfully
 */
wishlistRouter.get("/", authenticateToken, asyncHandler(wishlistController.getAll));

/**
 * @swagger
 * /wishlists/has/{productId}:
 *   get:
 *     summary: Whether the signed-in user has saved a product
 *     tags: [Wishlist]
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
 *     description: Lets a product page render the filled/empty heart without fetching the whole list.
 *     responses:
 *       200:
 *         description: Wishlist status fetched successfully
 */
wishlistRouter.get("/has/:productId", authenticateToken, asyncHandler(wishlistController.has));

/**
 * @swagger
 * /wishlists/has/variant/{variantId}:
 *   get:
 *     summary: Is this SKU in the signed-in user's wishlist?
 *     tags: [Wishlist]
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
 *         name: variantId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Wishlist status fetched successfully
 */
// Three segments, so it cannot be shadowed by the two-segment /has/:productId above.
wishlistRouter.get("/has/variant/:variantId", authenticateToken, asyncHandler(wishlistController.hasVariant));

/**
 * @swagger
 * /wishlists/{id}:
 *   get:
 *     summary: Get a wishlist item by ID
 *     tags: [Wishlist]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Wishlist item fetched successfully
 *       403:
 *         description: Not your wishlist item
 *       404:
 *         description: Wishlist item not found
 */
wishlistRouter.get("/:id", authenticateToken, asyncHandler(wishlistController.getById));

/**
 * @swagger
 * /wishlists:
 *   post:
 *     summary: Save a product, or one of its SKUs, to the wishlist
 *     tags: [Wishlist]
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
 *             required:
 *               - variantId
 *             properties:
 *               variantId:
 *                 type: integer
 *                 description: The SKU to save. The product it belongs to is resolved server-side.
 *                 example: 19
 *     description: >
 *       Idempotent per (user, variant) - saving a SKU already on the list returns the existing
 *       entry instead of failing, and two SKUs of the same product are two separate saves.
 *       The body carries the variant only: the owner comes from the token, and the productId
 *       and storeCode are read off the variant, so none of the three can be spoofed. The SKU
 *       and its parent product must both be live in the caller's store.
 *     responses:
 *       201:
 *         description: Added to wishlist
 *       404:
 *         description: Product variant not found in this store
 */
wishlistRouter.post("/", authenticateToken, validate(createWishlistSchema), asyncHandler(wishlistController.create));

/**
 * @swagger
 * /wishlists/product/{productId}:
 *   delete:
 *     summary: Remove a product from the signed-in user's wishlist
 *     tags: [Wishlist]
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
 *     description: Convenience for a toggle button, which knows the productId but not the row id.
 *     responses:
 *       204:
 *         description: Removed from wishlist
 *       404:
 *         description: Wishlist item not found
 */
wishlistRouter.delete("/product/:productId", authenticateToken, asyncHandler(wishlistController.deleteByProduct));

/**
 * @swagger
 * /wishlists/variant/{variantId}:
 *   delete:
 *     summary: Remove a saved SKU from the signed-in user's wishlist
 *     tags: [Wishlist]
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
 *         name: variantId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Removed from wishlist
 *       404:
 *         description: Wishlist item not found
 */
// Registered before /:id so "variant" is not parsed as an id.
wishlistRouter.delete("/variant/:variantId", authenticateToken, asyncHandler(wishlistController.deleteByVariant));

/**
 * @swagger
 * /wishlists/{id}:
 *   delete:
 *     summary: Remove a wishlist item by ID
 *     tags: [Wishlist]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Removed from wishlist
 *       403:
 *         description: Not your wishlist item
 */
wishlistRouter.delete("/:id", authenticateToken, asyncHandler(wishlistController.delete));

export default wishlistRouter;
