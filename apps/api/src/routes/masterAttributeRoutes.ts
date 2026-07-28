import { Role } from "@prisma/client";
import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { MasterAttributeController } from "../controllers/master-attribute.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import authorization from "../middleware/authorization.middleware";
import { validate } from "../middleware/validate";
import { createMasterAttributeSchema, updateMasterAttributeSchema } from "../schemas/masterEntrySchema";

const masterAttributeRouter = Router();
const masterAttributeController = container.get<MasterAttributeController>(TYPES.MasterAttributeController);

// Reads are open to any signed-in user, because dropdowns all over the app consume
// them. Writes are master-data changes, so they stay with admins.
const ADMIN = [Role.SUPER_ADMIN, Role.ADMIN];

/**
 * @swagger
 * tags:
 *   - name: MasterAttribute
 *     description: Master data groups (Size, Color, Weight) that hold master entries
 */

/**
 * @swagger
 * /master-attributes:
 *   get:
 *     summary: Get master attributes
 *     tags: [MasterAttribute]
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
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Matches name, code or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Published, Draft, Trash]
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Exact code match (case-insensitive input, e.g. SIZE)
 *       - in: query
 *         name: showAllRecords
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, code, status, displayOrder, createdAt, updatedAt]
 *         description: Defaults to createdAt. Pass displayOrder for dropdown order.
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Master attributes fetched successfully
 */
masterAttributeRouter.get("/", authenticateToken, asyncHandler(masterAttributeController.getAll));

/**
 * @swagger
 * /master-attributes/code/{code}:
 *   get:
 *     summary: Get a master attribute by its stable code
 *     tags: [MasterAttribute]
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
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: SIZE
 *     responses:
 *       200:
 *         description: Master attribute fetched successfully
 *       404:
 *         description: Master attribute not found
 */
masterAttributeRouter.get("/code/:code", authenticateToken, asyncHandler(masterAttributeController.getByCode));

/**
 * @swagger
 * /master-attributes/{id}:
 *   get:
 *     summary: Get a master attribute by ID
 *     tags: [MasterAttribute]
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
 *         description: Master attribute fetched successfully
 *       404:
 *         description: Master attribute not found
 */
masterAttributeRouter.get("/:id", authenticateToken, asyncHandler(masterAttributeController.getById));

/**
 * @swagger
 * /master-attributes:
 *   post:
 *     summary: Create a master attribute (admin only)
 *     tags: [MasterAttribute]
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
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: Size
 *               code:
 *                 type: string
 *                 example: SIZE
 *                 description: Uppercase letters, numbers and underscores. Stable key used across the app.
 *               description:
 *                 type: string
 *               unit:
 *                 type: string
 *                 example: cm
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Master attribute created successfully
 *       400:
 *         description: Validation error or duplicate name/code for this store
 */
masterAttributeRouter.post(
  "/",
  authenticateToken,
  authorization(ADMIN),
  validate(createMasterAttributeSchema),
  asyncHandler(masterAttributeController.create)
);

/**
 * @swagger
 * /master-attributes/{id}:
 *   put:
 *     summary: Update a master attribute (admin only)
 *     tags: [MasterAttribute]
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
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
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
 *         description: Master attribute updated successfully
 */
masterAttributeRouter.put(
  "/:id",
  authenticateToken,
  authorization(ADMIN),
  validate(updateMasterAttributeSchema),
  asyncHandler(masterAttributeController.update)
);

/**
 * @swagger
 * /master-attributes/{id}:
 *   delete:
 *     summary: Delete a master attribute (soft delete, admin only)
 *     tags: [MasterAttribute]
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
 *     description: Moves the group and all of its entries to Trash so the two stay consistent.
 *     responses:
 *       204:
 *         description: Master attribute deleted successfully
 */
masterAttributeRouter.delete("/:id", authenticateToken, authorization(ADMIN), asyncHandler(masterAttributeController.delete));

export default masterAttributeRouter;
