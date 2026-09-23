
import { attributeValidator, updateAttributeValidator } from "@pms/types";
import { Role } from "@prisma/client";
import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { AttributeController } from "../controllers/attribute.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import authorization from "../middleware/authorization.middleware";
import { storeRequiredMiddleware } from "../middleware/store-required.middleware";
import { validate } from "../middleware/validate";


const attributeRouter = Router();
const attributeController = container.get<AttributeController>(TYPES.AttributeController);

const STAFF_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

/**
 * @swagger
 * tags:
 *   - name: Attribute
 *     description: Attribute Management
 */

/**
 * @swagger
 * /attributes:
 *   post:
 *     summary: Create a new attribute
 *     description: storeCode is taken from the authenticated user's token, never from the body.
 *     tags: [Attribute]
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               unit:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Attribute created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 */
attributeRouter.post(
  "/",
  authenticateToken,
  authorization(STAFF_ROLES),
  storeRequiredMiddleware,
  validate(attributeValidator),
  asyncHandler(attributeController.create)
);


/**
 * @swagger
 * /attributes:
 *   get:
 *     summary: Get all attributes
 *     description: Scoped to the authenticated user's store.
 *     tags: [Attribute]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *         required: false
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Published, Draft, Trash]
 *         required: false
 *       - in: query
 *         name: showAllRecords
 *         schema:
 *           type: boolean
 *         required: false
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *     responses:
 *       200:
 *         description: Attributes fetched successfully
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 */
attributeRouter.get("/", authenticateToken, authorization(STAFF_ROLES), storeRequiredMiddleware, asyncHandler(attributeController.getAll));

/**
 * @swagger
 * /attributes/{id}:
 *   get:
 *     summary: Get attribute by ID
 *     tags: [Attribute]
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
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attribute fetched successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 *       404:
 *         description: Attribute not found
 */
attributeRouter.get("/:id", authenticateToken, authorization(STAFF_ROLES), storeRequiredMiddleware, asyncHandler(attributeController.getById));


/**
 * @swagger
 * /attributes/{id}:
 *   put:
 *     summary: Update an attribute
 *     description: Partial update - only the properties present in the body are written.
 *     tags: [Attribute]
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
 *               name:
 *                 type: string
 *               unit:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Attribute updated successfully
 *       400:
 *         description: Invalid id, or validation failed
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 *       404:
 *         description: Attribute not found
 */
attributeRouter.put(
  "/:id",
  authenticateToken,
  authorization(STAFF_ROLES),
  storeRequiredMiddleware,
  validate(updateAttributeValidator),
  asyncHandler(attributeController.update)
);

/**
 * @swagger
 * /attributes/{id}:
 *   delete:
 *     summary: Delete an attribute
 *     tags: [Attribute]
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
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Attribute deleted successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 *       404:
 *         description: Attribute not found
 */
attributeRouter.delete(
  "/:id",
  authenticateToken,
  authorization(STAFF_ROLES),
  storeRequiredMiddleware,
  asyncHandler(attributeController.delete)
);

export default attributeRouter;
