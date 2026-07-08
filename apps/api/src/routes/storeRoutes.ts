import { Router } from "express";
import { createStoreSchema, updateStoreSchema } from "../schemas/storeSchema";
import { validate } from "../middleware/validate";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { StoreController } from "../controllers/store.controller";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { authenticateToken } from "../middleware/authentication.middleware";

const storeRouter = Router();

const storeController = container.get<StoreController>(TYPES.StoreController);

/**
 * @swagger
 * tags:
 *   - name: Store
 *     description: Store Management
 */

/**
 * @swagger
 * /stores:
 *   get:
 *     summary: Get all stores
 *     tags: [Store]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number (default 1)
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *         required: false
 *         description: Records per page (default 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search by name or code
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Filter by active status
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Published, Draft, Trash]
 *         required: false
 *         description: Filter by status
 *       - in: query
 *         name: showAllRecords
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Get all records without pagination
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *     responses:
 *       200: { description: Success }
 *       400: { description: Bad Request }
 *       500: { description: Server error }
 */
storeRouter.get("/", asyncHandler(storeController.getAll));

/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     summary: Get store by id
 *     tags: [Store]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *     responses:
 *       200: { description: Success }
 *       400: { description: Bad Request }
 *       404: { description: Store not found }
 *       500: { description: Server error }
 */
storeRouter.get("/:id", asyncHandler(storeController.getById));

/**
 * @swagger
 * /stores:
 *   post:
 *     summary: Create a new store
 *     tags: [Store]
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *     security:
 *       - bearerAuth: []
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
 *               name: { type: string }
 *               code: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               isActive: { type: boolean }
 *               status: { type: string, enum: [Published, Draft, Trash] }
 *             example:
 *               name: "Main Store"
 *               code: "STORE-001"
 *               address: "123 Main St"
 *               phone: "9876543210"
 *               email: "store@example.com"
 *               isActive: true
 *               status: "Published"
 *     responses:
 *       201: { description: Store created successfully }
 *       400: { description: Bad Request }
 *       500: { description: Server error }
 */
storeRouter.post("/", [validate(createStoreSchema)], asyncHandler(storeController.create));

/**
 * @swagger
 * /stores/{id}:
 *   put:
 *     summary: Update store
 *     tags: [Store]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               isActive: { type: boolean }
 *               status: { type: string, enum: [Published, Draft, Trash] }
 *     responses:
 *       200: { description: Store updated successfully }
 *       400: { description: Bad Request }
 *       404: { description: Store not found }
 *       500: { description: Server error }
 */
storeRouter.put("/:id", authenticateToken, [validate(updateStoreSchema)], asyncHandler(storeController.update));

/**
 * @swagger
 * /stores/{id}:
 *   delete:
 *     summary: Delete store
 *     tags: [Store]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Store deleted successfully }
 *       400: { description: Bad Request }
 *       404: { description: Store not found }
 *       500: { description: Server error }
 */
storeRouter.delete("/:id", authenticateToken, asyncHandler(storeController.delete));

export default storeRouter;
