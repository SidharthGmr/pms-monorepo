import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { OrderItemController } from "../controllers/order-item.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";
import { createOrderItemSchema, updateOrderItemSchema } from "../schemas/orderItemSchema";

const orderItemRouter = Router();
const orderItemController = container.get<OrderItemController>(TYPES.OrderItemController);

/**
 * @swagger
 * tags:
 *   - name: OrderItem
 *     description: Order Item Management
 */

/**
 * @swagger
 * /order-items/order/{orderId}:
 *   get:
 *     summary: Get items by order ID
 *     tags: [OrderItem]
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
 *         description: Order items fetched successfully
 */
orderItemRouter.get("/order/:orderId", authenticateToken, asyncHandler(orderItemController.getByOrderId));

/**
 * @swagger
 * /order-items/{id}:
 *   get:
 *     summary: Get order item by ID
 *     tags: [OrderItem]
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
 *         description: Order item fetched successfully
 *       404:
 *         description: Order item not found
 */
orderItemRouter.get("/:id", authenticateToken, asyncHandler(orderItemController.getById));

/**
 * @swagger
 * /order-items:
 *   post:
 *     summary: Create an order item
 *     tags: [OrderItem]
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
 *             required: [orderId, productId, orderNumber,  quantity, unitPrice, totalPrice]
 *             properties:
 *               orderId:
 *                 type: integer
 *               productId:
 *                 type: integer
 *               orderNumber:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               unitPrice:
 *                 type: number
 *               totalPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order item created successfully
 */
orderItemRouter.post("/", authenticateToken, validate(createOrderItemSchema), asyncHandler(orderItemController.create));

/**
 * @swagger
 * /order-items/{id}:
 *   put:
 *     summary: Update an order item
 *     tags: [OrderItem]
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
 *               quantity:
 *                 type: integer
 *               unitPrice:
 *                 type: number
 *               totalPrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Order item updated successfully
 */
orderItemRouter.put("/:id", authenticateToken, validate(updateOrderItemSchema), asyncHandler(orderItemController.update));

/**
 * @swagger
 * /order-items/{id}:
 *   delete:
 *     summary: Delete an order item
 *     tags: [OrderItem]
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
 *         description: Order item deleted successfully
 */
orderItemRouter.delete("/:id", authenticateToken, asyncHandler(orderItemController.delete));

export default orderItemRouter;
