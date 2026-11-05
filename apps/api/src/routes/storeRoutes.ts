import { Router } from "express";
import { storeValidator, updateMyStoreValidator, updateStoreValidator } from "@pms/types";
import { validate } from "../middleware/validate";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { StoreController } from "../controllers/store.controller";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { authenticateToken } from "../middleware/authentication.middleware";
import authorization from "../middleware/authorization.middleware";
import { Role } from "@prisma/client";

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

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
storeRouter.get("/", authenticateToken, asyncHandler(storeController.getAll));

/**
 * @swagger
 * /stores/my-store:
 *   get:
 *     summary: Get the authenticated user's own store
 *     description: The store is resolved from the storeCode in the bearer token.
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200: { description: Success }
 *       400: { description: Token carries no storeCode }
 *       404: { description: Store not found }
 */
storeRouter.get("/my-store", authenticateToken, asyncHandler(storeController.getMyStore));

/**
 * @swagger
 * /stores/my-store:
 *   put:
 *     summary: Update the authenticated admin's own store (contact details and branding only)
 *     description: The store is resolved from the storeCode in the bearer token. Code, status and isActive can only be changed by a super admin via PUT /stores/{id}.
 *     tags: [Store]
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
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               siteName: { type: string }
 *               storeLogo: { type: string }
 *     responses:
 *       200: { description: Store updated successfully }
 *       400: { description: Validation failed or token carries no storeCode }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Store not found }
 */
storeRouter.put(
  "/my-store",
  authenticateToken,
  authorization(ADMIN_ROLES),
  [validate(updateMyStoreValidator)],
  asyncHandler(storeController.updateMyStore)
);

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
storeRouter.get("/:id", authenticateToken, asyncHandler(storeController.getById));

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
 *               - email
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               siteName: { type: string }
 *               storeLogo: { type: string }
 *               isActive: { type: boolean }
 *               status: { type: string, enum: [Published, Draft, Trash] }
 *             example:
 *               name: "Main Store"
 *               code: "STORE-001"
 *               phone: "9876543210"
 *               email: "store@example.com"
 *               isActive: true
 *               status: "Published"
 *     responses:
 *       201: { description: Store created successfully }
 *       400: { description: Bad Request }
 *       500: { description: Server error }
 */
storeRouter.post("/", authenticateToken, authorization([Role.SUPER_ADMIN]), [validate(storeValidator)], asyncHandler(storeController.create));

/**
 * @swagger
 * /stores/{id}:
 *   put:
 *     summary: Update store (super admin only)
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
 *               phone: { type: string }
 *               email: { type: string }
 *               siteName: { type: string }
 *               storeLogo: { type: string }
 *               isActive: { type: boolean }
 *               status: { type: string, enum: [Published, Draft, Trash] }
 *     responses:
 *       200: { description: Store updated successfully }
 *       400: { description: Bad Request }
 *       404: { description: Store not found }
 *       500: { description: Server error }
 */
storeRouter.put("/:id", authenticateToken, authorization([Role.SUPER_ADMIN]), [validate(updateStoreValidator)], asyncHandler(storeController.update));

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
storeRouter.delete("/:id", authenticateToken, authorization([Role.SUPER_ADMIN]), asyncHandler(storeController.delete));

export default storeRouter;
