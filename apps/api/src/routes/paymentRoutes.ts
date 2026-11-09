import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { PaymentController } from "../controllers/payment.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import authorization from "../middleware/authorization.middleware";
import { Role } from "@prisma/client";
import { validate } from "../middleware/validate";
import { createPaymentSchema, updatePaymentSchema } from "../schemas/paymentSchema";
import { paymentTransferValidator, paymentVoucherValidator, reversePaymentValidator } from "@pms/types";

const STAFF_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];
const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

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
paymentRouter.get("/order/:orderId", authenticateToken, authorization(STAFF_ROLES), asyncHandler(paymentController.getByOrderId));

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
/**
 * @swagger
 * /payments/vouchers:
 *   get:
 *     summary: List money vouchers - receipts, payments and transfers
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: recordPerPage
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: direction
 *         schema: { type: string, enum: [IN, OUT] }
 *       - in: query
 *         name: method
 *         schema: { type: string, enum: [CASH, CARD, UPI, BANK_TRANSFER, ONLINE, PAY_LATER] }
 *       - in: query
 *         name: paymentStatus
 *         schema: { type: string, enum: [PENDING, PARTIAL, PAID, OVERDUE, CANCELLED] }
 *       - in: query
 *         name: partyType
 *         schema: { type: string, enum: [CUSTOMER, SUPPLIER, STAFF, OTHER] }
 *       - in: query
 *         name: partyId
 *         schema: { type: string }
 *       - in: query
 *         name: ledgerAccountId
 *         schema: { type: integer }
 *       - in: query
 *         name: orderId
 *         schema: { type: integer }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: showAllRecords
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [paymentDate, amount, method, status, direction, voucherNumber, createdAt, id] }
 *       - in: query
 *         name: sortDirection
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: A page of money vouchers, each with its allocations and unapplied amount
 */
paymentRouter.get("/vouchers", authenticateToken, authorization(ADMIN_ROLES), asyncHandler(paymentController.getAllVouchers));

/**
 * @swagger
 * /payments/outstanding:
 *   get:
 *     summary: What each customer still owes and what is still owed to each supplier
 *     description: Taken from the receivable and payable control accounts' own journal lines, so a balance here is always what the journal says. A party that nets to zero is left out.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       200:
 *         description: Receivable and payable totals with the parties behind them
 *       400:
 *         description: The token carries no store code
 */
paymentRouter.get("/outstanding", authenticateToken, authorization(ADMIN_ROLES), asyncHandler(paymentController.getOutstanding));

/**
 * @swagger
 * /payments/vouchers/{id}:
 *   get:
 *     summary: Get one money voucher
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: The voucher with its allocations and the journal entry it posted
 *       400:
 *         description: The id is not a number, or the token carries no store code
 *       404:
 *         description: No such payment in this store
 */
paymentRouter.get("/vouchers/:id", authenticateToken, authorization(ADMIN_ROLES), asyncHandler(paymentController.getVoucherById));

paymentRouter.get("/:id", authenticateToken, authorization(STAFF_ROLES), asyncHandler(paymentController.getById));

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
paymentRouter.post("/", authenticateToken, authorization(STAFF_ROLES), validate(createPaymentSchema), asyncHandler(paymentController.create));

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
paymentRouter.put("/:id", authenticateToken, authorization(STAFF_ROLES), validate(updatePaymentSchema), asyncHandler(paymentController.update));

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
paymentRouter.delete("/:id", authenticateToken, authorization([Role.SUPER_ADMIN, Role.ADMIN]), asyncHandler(paymentController.delete));

/**
 * @swagger
 * /payments/vouchers:
 *   post:
 *     summary: Record money in or out that is not a payment against one sales order
 *     description: A customer receipt or supplier payment settles that party's control account, which the API resolves - name a party or a counterAccountId, not both. Anything not listed in allocations stays unapplied as an advance. storeCode comes from the token.
 *     tags: [Payment]
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
 *             required: [direction, moneyAccountId, amount, method]
 *             properties:
 *               direction: { type: string, enum: [IN, OUT] }
 *               moneyAccountId: { type: integer }
 *               counterAccountId: { type: integer }
 *               partyType: { type: string, enum: [CUSTOMER, SUPPLIER, STAFF, OTHER] }
 *               partyId: { type: string }
 *               amount: { type: number, example: 1500 }
 *               method: { type: string, enum: [CASH, CARD, UPI, BANK_TRANSFER, ONLINE] }
 *               paymentDate: { type: string, format: date-time }
 *               referenceNumber: { type: string }
 *               remarks: { type: string }
 *               allocations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [targetType, targetId, amount]
 *                   properties:
 *                     targetType: { type: string, enum: [ORDER, PURCHASE, EXPENSE] }
 *                     targetId: { type: integer }
 *                     amount: { type: number }
 *     responses:
 *       201:
 *         description: The recorded voucher
 *       400:
 *         description: Validation failed, the account is not cash or bank, an allocation over-applies a document, or the chart is missing a control account
 *       401:
 *         description: The token carries no user id
 *       404:
 *         description: The account, party or allocated document was not found in this store
 */
paymentRouter.post("/vouchers", authenticateToken, authorization(ADMIN_ROLES), validate(paymentVoucherValidator), asyncHandler(paymentController.createVoucher));

/**
 * @swagger
 * /payments/transfers:
 *   post:
 *     summary: Move money between the business's own cash and bank accounts
 *     description: Both sides must be cash or bank accounts, so a transfer can never be recorded as income or an expense.
 *     tags: [Payment]
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
 *             required: [fromAccountId, toAccountId, amount]
 *             properties:
 *               fromAccountId: { type: integer }
 *               toAccountId: { type: integer }
 *               amount: { type: number, example: 5000 }
 *               paymentDate: { type: string, format: date-time }
 *               remarks: { type: string }
 *     responses:
 *       201:
 *         description: The recorded transfer
 *       400:
 *         description: Validation failed, the two accounts are the same, or one of them is not a cash or bank account
 *       401:
 *         description: The token carries no user id
 *       404:
 *         description: One of the accounts was not found in this store
 */
paymentRouter.post("/transfers", authenticateToken, authorization(ADMIN_ROLES), validate(paymentTransferValidator), asyncHandler(paymentController.transfer));

/**
 * @swagger
 * /payments/{id}/reverse:
 *   post:
 *     summary: Reverse a recorded payment
 *     description: Posts a reversing journal entry, marks the payment cancelled and releases its allocations. The original payment and voucher both remain, because the books are append-only.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       201:
 *         description: The payment in its reversed state
 *       400:
 *         description: The payment is already reversed, or its entry falls in a closed financial year
 *       401:
 *         description: The token carries no user id
 *       404:
 *         description: No such payment in this store
 */
paymentRouter.post("/:id/reverse", authenticateToken, authorization(ADMIN_ROLES), validate(reversePaymentValidator), asyncHandler(paymentController.reverseVoucher));

export default paymentRouter;
