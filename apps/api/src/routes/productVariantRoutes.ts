import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { ProductVariantController } from '../controllers/product-variant.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import { validate } from '../middleware/validate';
import { CreateProductVariantValidator } from '@pms/types';

const productVariantRouter = Router();
const productVariantController = container.get<ProductVariantController>(TYPES.ProductVariantController);

/**
 * @swagger
 * tags:
 *   - name: ProductVariant
 *     description: Product Variant Management (append-only variant/price history)
 */

/**
 * @swagger
 * /product-variants:
 *   post:
 *     summary: Record a new variant for a product
 *     tags: [ProductVariant]
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
 *               - productId
 *               - sellingPrice
 *             properties:
 *               productId:
 *                 type: integer
 *                 example: 5
 *                 description: Product to record a variant for (required)
 *               sellingPrice:
 *                 type: number
 *                 example: 1099.99
 *                 description: Selling price (required)
 *               costPrice:
 *                 type: number
 *                 nullable: true
 *                 example: 800.00
 *                 description: Cost price (optional)
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *                 description: When this variant becomes effective (defaults to now)
 *               reason:
 *                 type: string
 *                 nullable: true
 *                 example: "Seasonal price update"
 *                 description: Reason for the change (optional)
 *     responses:
 *       201:
 *         description: Product variant recorded successfully
 *       400:
 *         description: Validation error or store code not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *     description: Records a new variant. The previously active variant is deactivated automatically. storeCode and createdById are taken from the authenticated user's token.
 */
productVariantRouter.post('/', authenticateToken, validate(CreateProductVariantValidator), asyncHandler(productVariantController.create));

/**
 * @swagger
 * /product-variants/product/{productId}:
 *   get:
 *     summary: Get the variant-change history for a product
 *     tags: [ProductVariant]
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *         required: false
 *     responses:
 *       200:
 *         description: Product variant history fetched successfully
 *       404:
 *         description: Product not found
 */
productVariantRouter.get('/product/:productId', authenticateToken, asyncHandler(productVariantController.getHistory));

/**
 * @swagger
 * /product-variants/product/{productId}/effective:
 *   get:
 *     summary: Get the variant effective on a given date for a product
 *     tags: [ProductVariant]
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
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: Date to resolve the effective variant for (defaults to now)
 *     responses:
 *       200:
 *         description: Effective variant fetched successfully
 *       404:
 *         description: No variant found for the given date
 */
productVariantRouter.get('/product/:productId/effective', authenticateToken, asyncHandler(productVariantController.getEffective));

export default productVariantRouter;
