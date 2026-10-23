import { Router } from 'express';
import { Role } from '@prisma/client';
import { orderReturnStatusValidator, orderReturnValidator } from '@pms/types';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { OrderReturnController } from '../controllers/order-return.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import authorization from '../middleware/authorization.middleware';
import { validate } from '../middleware/validate';

const STAFF_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];
const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

const orderReturnRouter = Router();
const orderReturnController = container.get<OrderReturnController>(TYPES.OrderReturnController);

/**
 * @swagger
 * tags:
 *   - name: OrderReturn
 *     description: Returns and exchanges (RMA)
 */

/**
 * @swagger
 * /order-returns:
 *   post:
 *     summary: Create a return or exchange for a delivered order
 *     description: storeCode is taken from the authenticated user's token. Prices come from the sold order lines; an EXCHANGE also creates the replacement order and links it.
 *     tags: [OrderReturn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, type, reason, items]
 *             properties:
 *               orderId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [REFUND, EXCHANGE]
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *               refundMethod:
 *                 type: string
 *                 enum: [CASH, CARD, UPI, BANK_TRANSFER, ONLINE, PAY_LATER]
 *               overrideWindow:
 *                 type: boolean
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [orderItemId, quantity]
 *                   properties:
 *                     orderItemId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     condition:
 *                       type: string
 *                       enum: [SELLABLE, DAMAGED]
 *               exchangeItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [variantId, quantity]
 *                   properties:
 *                     variantId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Return created
 *       400:
 *         description: Validation failed, window closed, quantity exceeds what is returnable, or refund exceeds the order value
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Role not allowed or order belongs to another store
 *       404:
 *         description: Order or order line not found
 */
orderReturnRouter.post('/', authenticateToken, authorization(STAFF_ROLES), validate(orderReturnValidator), asyncHandler(orderReturnController.create));

/**
 * @swagger
 * /order-returns:
 *   get:
 *     summary: Get all returns
 *     tags: [OrderReturn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [REQUESTED, APPROVED, RECEIVED, COMPLETED, REJECTED, CANCELLED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [REFUND, EXCHANGE]
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [returnNumber, type, status, refundAmount, resolvedAt, createdAt, updatedAt, id]
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *       - in: query
 *         name: showAllRecords
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Returns fetched
 *       400:
 *         description: Missing store code
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Role not allowed
 */
orderReturnRouter.get('/', authenticateToken, authorization(STAFF_ROLES), asyncHandler(orderReturnController.getAll));

/**
 * @swagger
 * /order-returns/{id}:
 *   get:
 *     summary: Get a return by id
 *     tags: [OrderReturn]
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
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Return fetched
 *       400:
 *         description: Invalid id or missing store code
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Role not allowed or return belongs to another store
 *       404:
 *         description: Return not found
 */
orderReturnRouter.get('/:id', authenticateToken, authorization(STAFF_ROLES), asyncHandler(orderReturnController.getById));

/**
 * @swagger
 * /order-returns/{id}:
 *   put:
 *     summary: Edit a return while it is still requested
 *     description: Shares the create schema. An EXCHANGE only accepts reason and notes here - cancel and recreate it to change lines.
 *     tags: [OrderReturn]
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
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, type, reason, items]
 *             properties:
 *               orderId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [REFUND, EXCHANGE]
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *               refundMethod:
 *                 type: string
 *                 enum: [CASH, CARD, UPI, BANK_TRANSFER, ONLINE, PAY_LATER]
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [orderItemId, quantity]
 *                   properties:
 *                     orderItemId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     condition:
 *                       type: string
 *                       enum: [SELLABLE, DAMAGED]
 *     responses:
 *       200:
 *         description: Return updated
 *       400:
 *         description: Validation failed or the return is no longer editable
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Role not allowed or return belongs to another store
 *       404:
 *         description: Return or order line not found
 */
orderReturnRouter.put('/:id', authenticateToken, authorization(STAFF_ROLES), validate(orderReturnValidator), asyncHandler(orderReturnController.update));

/**
 * @swagger
 * /order-returns/{id}:
 *   delete:
 *     summary: Delete a requested refund return
 *     tags: [OrderReturn]
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
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Return deleted
 *       400:
 *         description: Invalid id, or the return is past REQUESTED or is an exchange
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Role not allowed or return belongs to another store
 *       404:
 *         description: Return not found
 */
orderReturnRouter.delete('/:id', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(orderReturnController.delete));

/**
 * @swagger
 * /order-returns/{id}/status:
 *   patch:
 *     summary: Move a return through its workflow
 *     description: REQUESTED to APPROVED/REJECTED/CANCELLED, APPROVED to RECEIVED/CANCELLED, RECEIVED to COMPLETED. Approve, reject and complete need an admin; RECEIVED restocks the sellable items.
 *     tags: [OrderReturn]
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
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [REQUESTED, APPROVED, RECEIVED, COMPLETED, REJECTED, CANCELLED]
 *               refundMethod:
 *                 type: string
 *                 enum: [CASH, CARD, UPI, BANK_TRANSFER, ONLINE, PAY_LATER]
 *               refundTransactionId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return status updated
 *       400:
 *         description: Invalid transition or missing refund method
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Transition needs an admin or return belongs to another store
 *       404:
 *         description: Return not found
 */
orderReturnRouter.patch('/:id/status', authenticateToken, authorization(STAFF_ROLES), validate(orderReturnStatusValidator), asyncHandler(orderReturnController.updateStatus));

/**
 * @swagger
 * /order-returns/returned-quantities/{orderId}:
 *   get:
 *     summary: Units per order line already claimed by live returns
 *     tags: [OrderReturn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Returned quantities fetched
 *       400:
 *         description: Invalid order id or missing store code
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Role not allowed or order belongs to another store
 *       404:
 *         description: Order not found
 */
orderReturnRouter.get('/returned-quantities/:orderId', authenticateToken, authorization(STAFF_ROLES), asyncHandler(orderReturnController.getReturnedQuantities));

export default orderReturnRouter;
