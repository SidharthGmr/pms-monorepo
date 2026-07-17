import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { OrderController } from "../controllers/order.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";
import { createOrderSchema, updateOrderSchema } from "../schemas/orderSchema";

const orderRouter = Router();
const orderController = container.get<OrderController>(TYPES.OrderController);

/**
 * @swagger
 * tags:
 *   - name: Order
 *     description: Order Management
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 */
orderRouter.get("/", authenticateToken, asyncHandler(orderController.getAll));

/**
 * @swagger
 * /orders/customer/{customerId}:
 *   get:
 *     summary: Get orders by customer ID
 *     tags: [Order]
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
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 */
orderRouter.get("/customer/:customerId", authenticateToken, asyncHandler(orderController.getByCustomerId));

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Order]
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
 *         description: Order fetched successfully
 *       404:
 *         description: Order not found
 */
orderRouter.get("/:id", authenticateToken, asyncHandler(orderController.getById));

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Order]
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
 *                 example: "uuid-or-id"
 *                 description: ID of the customer who placed this order
 *               totalAmount:
 *                 type: number
 *               discount:
 *                 type: number
 *               tax:
 *                 type: number
 *               shippingCost:
 *                 type: number
 *               grandTotal:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, RETURNED]
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 description: List of items in the order
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     unitPrice:
 *                       type: number
 *                     totalPrice:
 *                       type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 */
orderRouter.post("/", authenticateToken, validate(createOrderSchema), asyncHandler(orderController.create));

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update an order
 *     tags: [Order]
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
 *               customerId:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               discount:
 *                 type: number
 *               tax:
 *                 type: number
 *               shippingCost:
 *                 type: number
 *               grandTotal:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, RETURNED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 */
orderRouter.put("/:id", authenticateToken, validate(updateOrderSchema), asyncHandler(orderController.update));

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Order]
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
 *         description: Order deleted successfully
 */
orderRouter.delete("/:id", authenticateToken, asyncHandler(orderController.delete));

export default orderRouter;
