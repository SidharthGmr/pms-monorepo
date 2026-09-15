import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { AttributeController } from "../controllers/attribute.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";
import { attributeValidator } from "@pms/types";

const attributeRouter = Router();
const attributeController = container.get<AttributeController>(TYPES.AttributeController);

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
 *         description: Store code not found. User must be associated with a store.
 */
attributeRouter.post("/", authenticateToken, validate(attributeValidator), asyncHandler(attributeController.create));


/**
 * @swagger
 * /attributes:
 *   get:
 *     summary: Get all attributes
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
 */
attributeRouter.get("/", authenticateToken, asyncHandler(attributeController.getAll));

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
 *       404:
 *         description: Attribute not found
 */
attributeRouter.get("/:id", authenticateToken, asyncHandler(attributeController.getById));


/**
 * @swagger
 * /attributes/{id}:
 *   put:
 *     summary: Update an attribute
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
 *       200:
 *         description: Attribute updated successfully
 *       400:
 *         description: Invalid id
 *       404:
 *         description: Attribute not found
 */
attributeRouter.put("/:id", authenticateToken, validate(attributeValidator), asyncHandler(attributeController.update));

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
 *       404:
 *         description: Attribute not found
 */
attributeRouter.delete("/:id", authenticateToken, asyncHandler(attributeController.delete));

export default attributeRouter;
