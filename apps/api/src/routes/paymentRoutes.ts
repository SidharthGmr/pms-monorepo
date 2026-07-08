import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { PaymentController } from "../controllers/payment.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";
import { createPaymentSchema, updatePaymentSchema } from "../schemas/paymentSchema";

const paymentRouter = Router();
const paymentController = container.get<PaymentController>(TYPES.PaymentController);

/**
 * @swagger
 * tags:
 *   - name: Payment
 *     description: Payment Management
 */

/**
 * @swagger
 * /payments/order/{orderId}:
 *   get:
 *     summary: Get payments by order ID
 *     tags: [Payment]
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
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 */
paymentRouter.get("/order/:orderId", authenticateToken, asyncHandler(paymentController.getByOrderId));

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payment]
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
 *         description: Payment fetched successfully
 *       404:
 *         description: Payment not found
 */
paymentRouter.get("/:id", authenticateToken, asyncHandler(paymentController.getById));

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create a payment
 *     tags: [Payment]
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
 *             required: [orderId, storeId, amount, method]
 *             properties:
 *               orderId:
 *                 type: integer
 *               storeId:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the store this payment belongs to
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [CASH, CARD, UPI, BANK_TRANSFER, ONLINE]
 *               status:
 *                 type: string
 *                 enum: [PENDING, PARTIAL, PAID, OVERDUE, CANCELLED]
 *               transactionId:
 *                 type: string
 *               paymentDate:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment created successfully
 */
paymentRouter.post("/", authenticateToken, validate(createPaymentSchema), asyncHandler(paymentController.create));

/**
 * @swagger
 * /payments/{id}:
 *   put:
 *     summary: Update a payment
 *     tags: [Payment]
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
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [CASH, CARD, UPI, BANK_TRANSFER, ONLINE]
 *               status:
 *                 type: string
 *                 enum: [PENDING, PARTIAL, PAID, OVERDUE, CANCELLED]
 *               transactionId:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment updated successfully
 */
paymentRouter.put("/:id", authenticateToken, validate(updatePaymentSchema), asyncHandler(paymentController.update));

/**
 * @swagger
 * /payments/{id}:
 *   delete:
 *     summary: Delete a payment
 *     tags: [Payment]
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
 *         description: Payment deleted successfully
 */
paymentRouter.delete("/:id", authenticateToken, asyncHandler(paymentController.delete));

export default paymentRouter;
