import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { ProductVariantController } from '../controllers/product-variant.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import { validate } from '../middleware/validate';
import { CreateProductVariantValidator, RateProductVariantValidator, UpdateProductVariantValidator } from '@pms/types';

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
 *     security:
 *       - bearerAuth: []
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
 *         name: productId
 *         schema:
 *           type: integer
 *         description: Narrow to one product's sellable variants
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
 *                 description: List price (required). Filed in the PriceHistory ledger, which is the only place a price lives.
 *               costPrice:
 *                 type: number
 *                 nullable: true
 *                 example: 800.00
 *                 description: Cost price (optional)
 *               offerPrice:
 *                 type: number
 *                 nullable: true
 *                 example: 400.00
 *                 description: >
 *                   Promotional amount for this price period (optional). Filed on the same ledger
 *                   row as sellingPrice, but only charged while isOffer is true - so an offerPrice
 *                   sent with isOffer false stages a promotion without applying it.
 *               isOffer:
 *                 type: boolean
 *                 example: false
 *                 description: >
 *                   Turns the promotion on. A column on the variant, not the ledger. With it on and
 *                   an offerPrice set, carts and orders are billed the offerPrice; otherwise the
 *                   sellingPrice. Defaults to false.
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *                 description: When this variant becomes effective (defaults to now)
 *               effectiveTo:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: >
 *                   Ends this price period. Normally omitted - the next price closes the row
 *                   automatically. Set it to time-box a price: once it passes the variant has NO
 *                   effective price and reads as unpriced until another row takes over.
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
 *       truth for what the variant costs - price is not a column on the variant, it is resolved
 *       from the effective ledger row on every read. By default the previously active variant is deactivated (a price
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
 *               attributes:
 *                 type: object
 *                 additionalProperties:
 *                   oneOf:
 *                     - type: string
 *                     - type: number
 *                     - type: boolean
 *                 example: { "size": "L", "color": "Red" }
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               lowStockThreshold:
 *                 type: integer
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *               isOffer:
 *                 type: boolean
 *                 description: >
 *                   Turns the promotion on or off. A plain column, so toggling it does NOT file a
 *                   new ledger row - price history is left untouched.
 *               sellingPrice:
 *                 type: number
 *                 description: Reprice. Appended to the PriceHistory ledger when it differs from the effective row.
 *               offerPrice:
 *                 type: number
 *                 nullable: true
 *                 description: >
 *                   Part of the same reprice - a changed offer amount files a new ledger row too.
 *                   Omit it to carry the current offer amount forward unchanged.
 *               costPrice:
 *                 type: number
 *                 nullable: true
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *                 description: When the repriced row takes effect (defaults to now).
 *               effectiveTo:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: >
 *                   Ends this price period. Normally omitted - the next price closes the row
 *                   automatically. Set it to time-box a price: once it passes the variant has NO
 *                   effective price and reads as unpriced until another row takes over.
 *               stockQuantity:
 *                 type: integer
 *                 nullable: true
 *                 description: Target on-hand figure; the delta needed to reach it is booked as a stock movement.
 *               reason:
 *                 type: string
 *                 nullable: true
 *     description: >
 *       Plain columns (name, sku, barcode, attributes, images, threshold, isActive, isOffer) are
 *       written directly. Price and stock are not columns: a changed sellingPrice/offerPrice/costPrice
 *       is appended to the PriceHistory ledger, and a changed stockQuantity is booked as a stock
 *       adjustment - so neither history is ever overwritten.
 *     responses:
 *       200:
 *         description: Product variant updated successfully
 *       403:
 *         description: Variant does not belong to your store
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
 * /product-variants/rating/{id}:
 *   post:
 *     summary: Rate a variant (1-5 stars)
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
 *         description: The variant being rated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *                 description: Whole stars, 1 to 5
 *     responses:
 *       200:
 *         description: Rating saved successfully
 *       400:
 *         description: Validation error, invalid variant id, or store code not found
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Variant not found in this store
 */
productVariantRouter.post('/rating/:id', authenticateToken, validate(RateProductVariantValidator), asyncHandler(productVariantController.rate));

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
