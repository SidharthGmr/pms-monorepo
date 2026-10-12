import { SubscriberValidator } from "@pms/types";
import { Role } from "@prisma/client";
import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { SubscriberController } from "../controllers/subscriber.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import authorization from "../middleware/authorization.middleware";
import { authLimiter } from "../middleware/rateLimiter.middleware";
import { validate } from "../middleware/validate";

const subscriberRouter = Router();
const subscriberController = container.get<SubscriberController>(TYPES.SubscriberController);

const STAFF_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

/**
 * @swagger
 * tags:
 *   - name: Subscriber
 *     description: Newsletter Subscribers
 */

/**
 * @swagger
 * /subscribers/public:
 *   post:
 *     summary: Subscribe to the newsletter (public)
 *     tags: [Subscriber]
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *       - in: query
 *         name: storeCode
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: You are already subscribed
 *       201:
 *         description: Subscribed - welcome aboard
 *       400:
 *         description: Validation failed
 *       429:
 *         description: Too many attempts. Please try again later.
 */
subscriberRouter.post("/public", authLimiter, validate(SubscriberValidator), asyncHandler(subscriberController.subscribePublic));

/**
 * @swagger
 * /subscribers:
 *   get:
 *     summary: Get all subscribers
 *     tags: [Subscriber]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [email, createdAt, unsubscribedAt, id]
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
 *         description: Subscribers fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
subscriberRouter.get("/", authenticateToken, authorization(STAFF_ROLES), asyncHandler(subscriberController.getAll));

/**
 * @swagger
 * /subscribers/{id}:
 *   delete:
 *     summary: Delete a subscriber
 *     tags: [Subscriber]
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
 *         description: Subscriber deleted successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Subscriber not found
 */
subscriberRouter.delete("/:id", authenticateToken, authorization(STAFF_ROLES), asyncHandler(subscriberController.delete));

export default subscriberRouter;
