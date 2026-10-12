import { ContactMessageValidator, updateContactMessageStatusValidator } from "@pms/types";
import { Role } from "@prisma/client";
import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { ContactMessageController } from "../controllers/contact-message.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import authorization from "../middleware/authorization.middleware";
import { authLimiter } from "../middleware/rateLimiter.middleware";
import { validate } from "../middleware/validate";

const contactMessageRouter = Router();
const contactMessageController = container.get<ContactMessageController>(TYPES.ContactMessageController);

const STAFF_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

/**
 * @swagger
 * tags:
 *   - name: ContactMessage
 *     description: Contact Form Messages
 */

/**
 * @swagger
 * /contact-messages/public:
 *   post:
 *     summary: Submit a contact form message (public)
 *     tags: [ContactMessage]
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
 *             required: [name, email, subject, message]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thanks - your message has been sent
 *       400:
 *         description: Validation failed
 *       429:
 *         description: Too many attempts. Please try again later.
 */
contactMessageRouter.post("/public", authLimiter, validate(ContactMessageValidator), asyncHandler(contactMessageController.createPublic));

/**
 * @swagger
 * /contact-messages:
 *   get:
 *     summary: Get all contact messages
 *     tags: [ContactMessage]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, READ, RESOLVED]
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
 *           enum: [name, email, subject, status, createdAt, updatedAt, id]
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
 *         description: Contact messages fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
contactMessageRouter.get("/", authenticateToken, authorization(STAFF_ROLES), asyncHandler(contactMessageController.getAll));

/**
 * @swagger
 * /contact-messages/{id}:
 *   get:
 *     summary: Get contact message by ID
 *     tags: [ContactMessage]
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
 *         description: Contact message fetched successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Contact message not found
 */
contactMessageRouter.get("/:id", authenticateToken, authorization(STAFF_ROLES), asyncHandler(contactMessageController.getById));

/**
 * @swagger
 * /contact-messages/{id}/status:
 *   patch:
 *     summary: Update only a contact message's status
 *     tags: [ContactMessage]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [NEW, READ, RESOLVED]
 *     responses:
 *       200:
 *         description: Contact message status updated successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Contact message not found
 */
contactMessageRouter.patch(
  "/:id/status",
  authenticateToken,
  authorization(STAFF_ROLES),
  validate(updateContactMessageStatusValidator),
  asyncHandler(contactMessageController.updateStatus)
);

/**
 * @swagger
 * /contact-messages/{id}:
 *   delete:
 *     summary: Delete a contact message
 *     tags: [ContactMessage]
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
 *         description: Contact message deleted successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Contact message not found
 */
contactMessageRouter.delete("/:id", authenticateToken, authorization(STAFF_ROLES), asyncHandler(contactMessageController.delete));

export default contactMessageRouter;
