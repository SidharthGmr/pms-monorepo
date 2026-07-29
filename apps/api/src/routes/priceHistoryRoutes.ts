import { Role } from '@prisma/client';
import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { PriceHistoryController } from '../controllers/price-history.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import authorization from '../middleware/authorization.middleware';
import { storeRequiredMiddleware } from '../middleware/store-required.middleware';
import { validate } from '../middleware/validate';
import { createPriceHistorySchema, updatePriceHistorySchema } from '../schemas/priceHistorySchema';

const priceHistoryRouter = Router();
const priceHistoryController = container.get<PriceHistoryController>(TYPES.PriceHistoryController);

const STAFF_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];
const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

/**
 * @swagger
 * tags:
 *   - name: PriceHistory
 *     description: >
 *       Append-only price ledger for a product variant. `ProductVariant.sellingPrice`/`costPrice`
 *       are a denormalized cache of the currently effective row; these endpoints are the source of
 *       truth for what a variant cost on any given date. All rows are scoped to the caller's store
 *       through the parent variant.
 */

/**
 * @swagger
 * /price-histories:
 *   get:
 *     summary: Get price history rows for the caller's store
 *     tags: [PriceHistory]
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
 *         description: Matches the change reason, variant SKU or product name
 *       - in: query
 *         name: showAllRecords
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *         description: Every price row for a product, across all of its variants
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filters on effectiveFrom
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filters on effectiveFrom
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [sellingPrice, costPrice, effectiveFrom, id]
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Price history fetched successfully
 */
priceHistoryRouter.get('/', authenticateToken, storeRequiredMiddleware, asyncHandler(priceHistoryController.getAll));

/**
 * @swagger
 * /price-histories/summary/{variantId}:
 *   get:
 *     summary: Current, first, min, max and average price for a variant
 *     tags: [PriceHistory]
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
 *         description: Price history summary fetched successfully
 *       403:
 *         description: Variant belongs to another store
 *       404:
 *         description: Product variant not found
 */
priceHistoryRouter.get('/summary/:variantId', authenticateToken, storeRequiredMiddleware, asyncHandler(priceHistoryController.getSummary));

/**
 * @swagger
 * /price-histories/variant/{variantId}:
 *   get:
 *     summary: Paginated price ledger for one variant, newest first
 *     tags: [PriceHistory]
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Price history fetched successfully
 *       403:
 *         description: Variant belongs to another store
 *       404:
 *         description: Product variant not found
 */
priceHistoryRouter.get('/variant/:variantId', authenticateToken, storeRequiredMiddleware, asyncHandler(priceHistoryController.getByVariant));

/**
 * @swagger
 * /price-histories/variant/{variantId}/effective:
 *   get:
 *     summary: Get the price effective on a given date for a variant
 *     tags: [PriceHistory]
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
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Defaults to now. Returns the row with the greatest effectiveFrom <= date.
 *     responses:
 *       200:
 *         description: Effective price fetched successfully
 *       404:
 *         description: No price found for the given date
 */
priceHistoryRouter.get(
  '/variant/:variantId/effective',
  authenticateToken,
  storeRequiredMiddleware,
  asyncHandler(priceHistoryController.getEffective)
);

/**
 * @swagger
 * /price-histories/{id}:
 *   get:
 *     summary: Get a price history row by ID
 *     tags: [PriceHistory]
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
 *         description: Price history fetched successfully
 *       403:
 *         description: Row belongs to another store
 *       404:
 *         description: Price history not found
 */
priceHistoryRouter.get('/:id', authenticateToken, storeRequiredMiddleware, asyncHandler(priceHistoryController.getById));

/**
 * @swagger
 * /price-histories:
 *   post:
 *     summary: Record a price change for a variant
 *     tags: [PriceHistory]
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
 *               - sellingPrice
 *             properties:
 *               variantId:
 *                 type: integer
 *                 example: 12
 *               sellingPrice:
 *                 type: number
 *                 example: 1099.99
 *               costPrice:
 *                 type: number
 *                 nullable: true
 *                 example: 800
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *                 description: Defaults to now. A future date stages the price without making it current.
 *               reason:
 *                 type: string
 *                 nullable: true
 *                 example: "Seasonal sale"
 *     description: >
 *       Appends to the ledger and refreshes the variant's cached price when the new row is the
 *       currently effective one. The variant must belong to the caller's store.
 *     responses:
 *       201:
 *         description: Price history recorded successfully
 *       400:
 *         description: Validation error or store code not found
 *       403:
 *         description: Variant belongs to another store
 *       404:
 *         description: Product variant not found
 */
priceHistoryRouter.post(
  '/',
  authenticateToken,
  authorization(STAFF_ROLES),
  storeRequiredMiddleware,
  validate(createPriceHistorySchema),
  asyncHandler(priceHistoryController.create)
);

/**
 * @swagger
 * /price-histories/{id}:
 *   put:
 *     summary: Correct a price history row (admin only)
 *     tags: [PriceHistory]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sellingPrice:
 *                 type: number
 *               costPrice:
 *                 type: number
 *                 nullable: true
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *                 nullable: true
 *     description: >
 *       The ledger is append-only in normal use - record a new row for a real price change.
 *       This endpoint exists to fix a mistyped price or effective date, and resyncs the
 *       variant's cached price afterwards.
 *     responses:
 *       200:
 *         description: Price history updated successfully
 *       403:
 *         description: Forbidden - admin only, or row belongs to another store
 *       404:
 *         description: Price history not found
 */
priceHistoryRouter.put(
  '/:id',
  authenticateToken,
  authorization(ADMIN_ROLES),
  storeRequiredMiddleware,
  validate(updatePriceHistorySchema),
  asyncHandler(priceHistoryController.update)
);

/**
 * @swagger
 * /price-histories/{id}:
 *   delete:
 *     summary: Delete a price history row (admin only, hard delete)
 *     tags: [PriceHistory]
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
 *     description: >
 *       PriceHistory has no status/deletedAt column, so this removes the row outright.
 *       Deleting the newest row rolls the variant's cached price back to the previous one.
 *     responses:
 *       200:
 *         description: Price history deleted successfully
 *       403:
 *         description: Forbidden - admin only, or row belongs to another store
 *       404:
 *         description: Price history not found
 */
priceHistoryRouter.delete(
  '/:id',
  authenticateToken,
  authorization(ADMIN_ROLES),
  storeRequiredMiddleware,
  asyncHandler(priceHistoryController.delete)
);

export default priceHistoryRouter;
