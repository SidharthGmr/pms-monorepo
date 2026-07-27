import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { CheckoutController } from '../controllers/checkout.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';

const checkoutRouter = Router();
const checkoutController = container.get<CheckoutController>(TYPES.CheckoutController);

/**
 * @swagger
 * tags:
 *   - name: Checkout
 *     description: Turns the caller's active cart into an order, either through
 *       Razorpay or directly with no payment taken. Item prices and the payable
 *       amount are always computed server-side from the cart.
 */

/**
 * @swagger
 * /checkout/summary:
 *   get:
 *     summary: Server-computed totals for the active cart
 *     tags: [Checkout]
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
 *         name: discount
 *         schema:
 *           type: number
 *         required: false
 *       - in: query
 *         name: tax
 *         schema:
 *           type: number
 *         required: false
 *       - in: query
 *         name: shippingCost
 *         schema:
 *           type: number
 *         required: false
 *     responses:
 *       200:
 *         description: Checkout summary fetched successfully
 *       400:
 *         description: The cart is empty, or an adjustment was negative
 */
checkoutRouter.get('/summary', authenticateToken, asyncHandler(checkoutController.getSummary));

/**
 * @swagger
 * /checkout/razorpay/orders:
 *   post:
 *     summary: Open a Razorpay order for the active cart
 *     description: The payable amount is derived from the cart on the server. Any
 *       `amount` in the body is ignored, so it cannot be tampered with.
 *     tags: [Checkout]
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               discount:
 *                 type: number
 *               tax:
 *                 type: number
 *               shippingCost:
 *                 type: number
 *     responses:
 *       201:
 *         description: Payment order created successfully
 *       400:
 *         description: Cart empty or payable amount not greater than zero
 *       503:
 *         description: Online payments are not configured on this server
 */
checkoutRouter.post('/razorpay/orders', authenticateToken, asyncHandler(checkoutController.createRazorpayOrder));

/**
 * @swagger
 * /checkout/razorpay/payments/verify:
 *   post:
 *     summary: Verify a Razorpay payment and place the order
 *     description: Verifies the HMAC signature, confirms the captured amount still
 *       matches the order, then creates the order and a PAID payment and empties
 *       the cart. Idempotent - replaying a callback returns the original order.
 *     tags: [Checkout]
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
 *             required: [customerId, razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               customerId:
 *                 type: string
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *               discount:
 *                 type: number
 *               tax:
 *                 type: number
 *               shippingCost:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment verified and order placed successfully
 *       400:
 *         description: Signature verification failed, amount mismatch, or empty cart
 */
checkoutRouter.post('/razorpay/payments/verify', authenticateToken, asyncHandler(checkoutController.verifyRazorpayPayment));

/**
 * @swagger
 * /checkout/direct:
 *   post:
 *     summary: Place the order with no payment taken
 *     description: Creates the order as PENDING and empties the cart, exactly as
 *       the POS screen does. No payment row is written - settle it via /payments.
 *     tags: [Checkout]
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
 *             required: [customerId]
 *             properties:
 *               customerId:
 *                 type: string
 *               discount:
 *                 type: number
 *               tax:
 *                 type: number
 *               shippingCost:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: Cart empty, missing customerId, or an adjustment was negative
 */
checkoutRouter.post('/direct', authenticateToken, asyncHandler(checkoutController.checkoutDirect));

export default checkoutRouter;
