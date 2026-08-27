import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { ProductVariantController } from '../controllers/product-variant.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import { validate } from '../middleware/validate';
import { CreateProductVariantValidator, UpdateProductVariantValidator } from '@pms/types';

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
 *   get:
 *     summary: Get every variant in the authenticated user's store (the SKU list)
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
 *         description: Matches SKU, variant name, barcode or product name
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: productIds
 *         schema:
 *           type: string
 *         required: false
 *         description: Comma-separated product IDs, e.g. `12,15,18`. Takes precedence over productId.
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: showAllRecords
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [sku, name, createdAt, id]
 *         description: Price and stock are derived, so they cannot be sorted on
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Product variants fetched successfully
 *       400:
 *         description: Store code not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *     description: >
 *       The store-wide SKU list, read across products. Each row carries the product it belongs
 *       to, its currently effective price from the PriceHistory ledger and its on-hand stock
 *       summed from stockHistory movements. Soft-deleted variants are never returned. Scoping
 *       is taken from the token, so one store can never read another's SKUs.
 */
productVariantRouter.get('/', authenticateToken, asyncHandler(productVariantController.getAll));

/**
 * @swagger
 * /product-variants/public:
 *   get:
 *     summary: Public storefront SKU listing (no authentication)
 *     tags: [ProductVariant]
 *     parameters:
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
 *         description: Matches SKU, variant name, barcode or product name
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: storeCode
 *         schema:
 *           type: string
 *         description: Optional store scoping for a single-tenant storefront
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [sku, name, createdAt, id]
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Product variants fetched successfully
 *     description: >
 *       Every sellable SKU a shopper may see: active variants of Published products only,
 *       each with its effective price, on-hand stock and the product it belongs to. Draft
 *       products and retired variants are never returned, and neither filter can be
 *       overridden from the query string.
 */
productVariantRouter.get('/public', asyncHandler(productVariantController.getAllPublic));


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
 *               sku:
 *                 type: string
 *                 example: "TSHIRT-001-RED-L"
 *                 description: Unique SKU. Generated from store + product when omitted.
 *               attributes:
 *                 type: object
 *                 additionalProperties:
 *                   oneOf:
 *                     - type: string
 *                     - type: number
 *                     - type: boolean
 *                 example: { "size": "L", "color": "Red" }
 *                 description: What makes this variant distinct. Keys are master-attribute codes, values are master-entry values.
 *               stockQuantity:
 *                 type: integer
 *                 example: 25
 *                 description: Opening stock for this variant (defaults to 0)
 *               supersedePrevious:
 *                 type: boolean
 *                 example: false
 *                 description: >
 *                   Defaults to true, which retires the product's other active variants - the
 *                   price-change behaviour. Send false when adding a real sibling variant so
 *                   Small and Large both stay active.
 *               sellingPrice:
 *                 type: number
 *                 example: 1099.99
 *                 description: Selling price (required). Filed in the PriceHistory ledger; the variant's own columns cache it.
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
 *     description: >
 *       Records a variant and files its price in the PriceHistory ledger, which is the source of
 *       truth for what the variant costs; the variant's own price columns are a cache of the
 *       effective ledger row. By default the previously active variant is deactivated (a price
 *       change) - pass supersedePrevious=false to add a sibling variant instead. storeCode and
 *       createdById are taken from the authenticated user's token.
 */
productVariantRouter.post('/', authenticateToken, validate(CreateProductVariantValidator), asyncHandler(productVariantController.create));

/**
 * @swagger
 * /product-variants/{id}:
 *   put:
 *     summary: Update a variant's safe fields (name, sku, barcode, low-stock threshold, active flag)
 *     tags: [ProductVariant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 nullable: true
 *               sku:
 *                 type: string
 *               barcode:
 *                 type: string
 *                 nullable: true
 *               lowStockThreshold:
 *                 type: integer
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product variant updated successfully
 *       404:
 *         description: Variant not found
 */
productVariantRouter.put('/:id', authenticateToken, validate(UpdateProductVariantValidator), asyncHandler(productVariantController.update));



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

/**
 * @swagger
 * /product-variants/{id}:
 *   get:
 *     summary: Get one variant with its parent product (the edit screen's read)
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
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product variant fetched successfully
 *       400:
 *         description: Invalid variant id or store code not found
 *       404:
 *         description: Variant not found
 *     description: >
 *       One variant with its effective price, on-hand stock and the product it belongs to.
 *       Scoped to the caller's store from the token, so another store's variant reads as
 *       404 rather than leaking. Registered last so it cannot shadow /public.
 */
productVariantRouter.get('/:id', authenticateToken, asyncHandler(productVariantController.getById));

export default productVariantRouter;
