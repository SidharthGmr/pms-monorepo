import { MarkNotificationsReadValidator } from "@pms/types";
import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { NotificationController } from "../controllers/notification.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";

const notificationRouter = Router();
const notificationController = container.get<NotificationController>(TYPES.NotificationController);

/**
 * @swagger
 * tags:
 *   - name: Notification
 *     description: In-app notifications
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List the signed-in user's notifications
 *     tags: [Notification]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [USER_REGISTERED, ORDER_PLACED, ORDER_STATUS_CHANGED, LOW_STOCK]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       400:
 *         description: Your session is missing a user. Please sign in again.
 *       401:
 *         description: Invalid or expired token
 */
notificationRouter.get("/", authenticateToken, asyncHandler(notificationController.getAll));

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Number of unread notifications for the signed-in user
 *     tags: [Notification]
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
 *         description: Unread count fetched successfully
 *       400:
 *         description: Your session is missing a user. Please sign in again.
 *       401:
 *         description: Invalid or expired token
 */
notificationRouter.get("/unread-count", authenticateToken, asyncHandler(notificationController.getUnreadCount));

/**
 * @swagger
 * /notifications/mark-read:
 *   post:
 *     summary: Mark notifications as read (all unread ones when no ids are sent)
 *     tags: [Notification]
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
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Invalid or expired token
 */
notificationRouter.post("/mark-read", authenticateToken, validate(MarkNotificationsReadValidator), asyncHandler(notificationController.markRead));

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete one of the signed-in user's notifications
 *     tags: [Notification]
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
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Invalid or expired token
 *       404:
 *         description: Notification not found
 */
notificationRouter.delete("/:id", authenticateToken, asyncHandler(notificationController.delete));

export default notificationRouter;
