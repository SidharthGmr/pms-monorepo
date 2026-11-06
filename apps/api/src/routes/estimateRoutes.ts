import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { EstimateController } from '../controllers/estimate.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import authorization from '../middleware/authorization.middleware';
import { validate } from '../middleware/validate';
import { estimateStatusValidator, estimateValidator } from '@pms/types';
import { Role } from '@prisma/client';

const STAFF_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

const estimateRouter = Router();
const estimateController = container.get<EstimateController>(TYPES.EstimateController);

/**
 * @swagger
 * tags:
 *   - name: Estimate
 *     description: Sales Estimate / Quotation Management
 */

/**
 * @swagger
 * /estimates:
 *   post:
 *     summary: Create a new estimate
 *     tags: [Estimate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerName, items]
 *             properties:
 *               customerId: { type: string }
 *               customerName: { type: string, minLength: 1, example: "Ravi Kumar" }
 *               customerPhone: { type: string }
 *               customerEmail: { type: string }
 *               billingAddress: { type: string }
 *               shippingAddress: { type: string }
 *               estimateDate: { type: string, format: date-time }
 *               validUntil: { type: string, format: date-time }
 *               referenceNumber: { type: string }
 *               notes: { type: string }
 *               terms: { type: string }
 *               additionalDiscountType: { type: string, enum: [PERCENTAGE, FLAT] }
 *               additionalDiscountValue: { type: number }
 *               shippingCharges: { type: number }
 *               adjustment: { type: number }
 *               isInterState: { type: boolean }
 *               status: { type: string, enum: [DRAFT, SENT] }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [variantId, quantity]
 *                   properties:
 *                     variantId: { type: integer }
 *                     quantity: { type: integer, example: 1 }
 *                     unitPrice: { type: number }
 *                     discountType: { type: string, enum: [PERCENTAGE, FLAT] }
 *                     discountValue: { type: number }
 *                     taxId: { type: string }
 *     responses:
 *       201:
 *         description: Estimate created successfully
 *       400:
 *         description: Validation error, store code not found, unpriced item, or discount larger than the amount it applies to
 *       403:
 *         description: A variant belongs to another store
 *       404:
 *         description: A variant was not found
 *     description: storeCode is taken from the authenticated user's token; all totals are recomputed on the server and prices/taxes are stored as snapshots. Creating an estimate never moves stock or money.
 */
estimateRouter.post('/', authenticateToken, authorization(STAFF_ROLES), validate(estimateValidator), asyncHandler(estimateController.create));

/**
 * @swagger
 * /estimates:
 *   get:
 *     summary: Get all estimates
 *     tags: [Estimate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED, CANCELLED] }
 *       - in: query
 *         name: customerId
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [estimateNumber, customerName, estimateDate, validUntil, grandTotal, status, createdAt, updatedAt, id] }
 *       - in: query
 *         name: sortDirection
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: recordPerPage
 *         schema: { type: integer }
 *       - in: query
 *         name: showAllRecords
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Estimates fetched successfully
 */
estimateRouter.get('/', authenticateToken, asyncHandler(estimateController.getAll));

/**
 * @swagger
 * /estimates/number/{estimateNumber}:
 *   get:
 *     summary: Get estimate by its number (e.g. EST-0001)
 *     tags: [Estimate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: estimateNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Estimate fetched successfully
 *       400:
 *         description: Invalid estimate number or store code not found
 *       404:
 *         description: Estimate not found
 *     description: The number is unique per store and the lookup is scoped to the authenticated user's store.
 */
estimateRouter.get('/number/:estimateNumber', authenticateToken, asyncHandler(estimateController.getByNumber));

/**
 * @swagger
 * /estimates/{id}:
 *   get:
 *     summary: Get estimate by ID
 *     tags: [Estimate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Estimate fetched successfully
 *       400:
 *         description: Invalid id
 *       403:
 *         description: The estimate belongs to another store
 *       404:
 *         description: Estimate not found
 */
estimateRouter.get('/:id', authenticateToken, asyncHandler(estimateController.getById));

/**
 * @swagger
 * /estimates/{id}:
 *   put:
 *     summary: Update a draft estimate
 *     tags: [Estimate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerName, items]
 *             properties:
 *               customerId: { type: string }
 *               customerName: { type: string, minLength: 1, example: "Ravi Kumar" }
 *               customerPhone: { type: string }
 *               customerEmail: { type: string }
 *               billingAddress: { type: string }
 *               shippingAddress: { type: string }
 *               estimateDate: { type: string, format: date-time }
 *               validUntil: { type: string, format: date-time }
 *               referenceNumber: { type: string }
 *               notes: { type: string }
 *               terms: { type: string }
 *               additionalDiscountType: { type: string, enum: [PERCENTAGE, FLAT] }
 *               additionalDiscountValue: { type: number }
 *               shippingCharges: { type: number }
 *               adjustment: { type: number }
 *               isInterState: { type: boolean }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [variantId, quantity]
 *                   properties:
 *                     variantId: { type: integer }
 *                     quantity: { type: integer, example: 1 }
 *                     unitPrice: { type: number }
 *                     discountType: { type: string, enum: [PERCENTAGE, FLAT] }
 *                     discountValue: { type: number }
 *                     taxId: { type: string }
 *     responses:
 *       200:
 *         description: Estimate updated successfully
 *       400:
 *         description: Validation error, invalid id, or the estimate is not a draft
 *       403:
 *         description: The estimate or a variant belongs to another store
 *       404:
 *         description: Estimate or a variant not found
 *     description: Only DRAFT estimates can be edited; items are replaced and every total is recomputed on the server.
 */
estimateRouter.put('/:id', authenticateToken, authorization(STAFF_ROLES), validate(estimateValidator), asyncHandler(estimateController.update));

/**
 * @swagger
 * /estimates/{id}:
 *   delete:
 *     summary: Delete an estimate (soft delete, draft or cancelled only)
 *     tags: [Estimate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Estimate deleted successfully
 *       400:
 *         description: Invalid id or the estimate is neither draft nor cancelled
 *       403:
 *         description: The estimate belongs to another store
 *       404:
 *         description: Estimate not found
 */
estimateRouter.delete('/:id', authenticateToken, authorization([Role.SUPER_ADMIN, Role.ADMIN]), asyncHandler(estimateController.delete));

/**
 * @swagger
 * /estimates/{id}/status:
 *   patch:
 *     summary: Move an estimate through its lifecycle (send, accept, reject, cancel, expire)
 *     tags: [Estimate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [SENT, ACCEPTED, REJECTED, CANCELLED, EXPIRED] }
 *               note: { type: string, maxLength: 500 }
 *     responses:
 *       200:
 *         description: Estimate status updated successfully
 *       400:
 *         description: Validation error, invalid id, a transition the lifecycle does not allow, or accepting an estimate whose validity has passed (it is marked EXPIRED instead)
 *       403:
 *         description: The estimate belongs to another store
 *       404:
 *         description: Estimate not found
 *     description: Transitions follow DRAFT→SENT→ACCEPTED; REJECTED/EXPIRED/CANCELLED close the estimate. CONVERTED is set only by the convert endpoint. Every change writes a status-history row.
 */
estimateRouter.patch(
  '/:id/status',
  authenticateToken,
  authorization(STAFF_ROLES),
  validate(estimateStatusValidator),
  asyncHandler(estimateController.updateStatus)
);

/**
 * @swagger
 * /estimates/{id}/duplicate:
 *   post:
 *     summary: Duplicate an estimate as a new draft
 *     tags: [Estimate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201:
 *         description: Estimate duplicated successfully
 *       400:
 *         description: Invalid id
 *       403:
 *         description: The estimate belongs to another store
 *       404:
 *         description: Estimate not found
 *     description: Copies the snapshots exactly - prices and taxes are NOT re-read from the ledger. The new draft gets the next number, today's date, and the same validity duration.
 */
estimateRouter.post('/:id/duplicate', authenticateToken, authorization(STAFF_ROLES), asyncHandler(estimateController.duplicate));

/**
 * @swagger
 * /estimates/{id}/share:
 *   post:
 *     summary: Mint (or re-read) the public share link for an estimate
 *     tags: [Estimate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Share link ready
 *       400:
 *         description: Invalid id or store code not found
 *       403:
 *         description: The estimate belongs to another store
 *       404:
 *         description: Estimate not found
 *     description: Returns the same token on every call, so a link already emailed to a customer keeps working. The token grants read-only access to the public document page.
 */
estimateRouter.post('/:id/share', authenticateToken, authorization(STAFF_ROLES), asyncHandler(estimateController.share));

export default estimateRouter;
