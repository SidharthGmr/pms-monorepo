import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { ProductPriceController } from '../controllers/product-price.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import { validate } from '../middleware/validate';
import { CreateProductPriceValidator } from '@pms/types';

const productPriceRouter = Router();
const productPriceController = container.get<ProductPriceController>(TYPES.ProductPriceController);

/**
 * @swagger
 * tags:
 *   - name: ProductPrice
 *     description: Product Price Management (append-only price history)
 */

/**
 * @swagger
 * /product-prices:
 *   post:
 *     summary: Record a new price for a product
 *     tags: [ProductPrice]
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
 *                 description: Product to record a price for (required)
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
 *                 description: When this price becomes effective (defaults to now)
 *               reason:
 *                 type: string
 *                 nullable: true
 *                 example: "Seasonal price update"
 *                 description: Reason for the price change (optional)
 *     responses:
 *       201:
 *         description: Product price recorded successfully
 *       400:
 *         description: Validation error or store code not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *     description: Records a new price. The previously active price is deactivated automatically. storeCode and createdById are taken from the authenticated user's token.
 */
productPriceRouter.post('/', authenticateToken, validate(CreateProductPriceValidator), asyncHandler(productPriceController.create));

/**
 * @swagger
 * /product-prices/product/{productId}:
 *   get:
 *     summary: Get the price-change history for a product
 *     tags: [ProductPrice]
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
 *         description: Product price history fetched successfully
 *       404:
 *         description: Product not found
 */
productPriceRouter.get('/product/:productId', authenticateToken, asyncHandler(productPriceController.getHistory));

/**
 * @swagger
 * /product-prices/product/{productId}/effective:
 *   get:
 *     summary: Get the price effective on a given date for a product
 *     tags: [ProductPrice]
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
 *         description: Date to resolve the effective price for (defaults to now)
 *     responses:
 *       200:
 *         description: Effective price fetched successfully
 *       404:
 *         description: No price found for the given date
 */
productPriceRouter.get('/product/:productId/effective', authenticateToken, asyncHandler(productPriceController.getEffective));

export default productPriceRouter;
