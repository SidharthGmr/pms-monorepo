import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { StaffController } from "../controllers/staff.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";
import { createStaffSchema, updateStaffSchema } from "../schemas/staffSchema";

const staffRouter = Router();
const staffController = container.get<StaffController>(TYPES.StaffController);

/**
 * @swagger
 * tags:
 *   - name: Staff
 *     description: Staff Management
 */

/**
 * @swagger
 * /staff:
 *   get:
 *     summary: Get all staff members
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *         description: Filter by store ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Filter by position
 *     responses:
 *       200:
 *         description: Staff members fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 */
staffRouter.get("/", authenticateToken, asyncHandler(staffController.getAll));

/**
 * @swagger
 * /staff/count:
 *   get:
 *     summary: Get staff count
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Staff count fetched successfully
 */
staffRouter.get("/count", authenticateToken, asyncHandler(staffController.getCount));

/**
 * @swagger
 * /staff/store/{storeCode}:
 *   get:
 *     summary: Get staff by store code
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: storeCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff members fetched successfully
 */
staffRouter.get("/store/:storeCode", authenticateToken, asyncHandler(staffController.getByStoreCode));

/**
 * @swagger
 * /staff/user/{userId}:
 *   get:
 *     summary: Get staff by user ID
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Staff fetched successfully
 *       404:
 *         description: Staff not found
 */
staffRouter.get("/user/:userId", authenticateToken, asyncHandler(staffController.getByUserId));

/**
 * @swagger
 * /staff/{id}:
 *   get:
 *     summary: Get staff by ID
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Staff fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 */
staffRouter.get("/:id", authenticateToken, asyncHandler(staffController.getById));

/**
 * @swagger
 * /staff:
 *   post:
 *     summary: Create new staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStaffRequest'
 *     responses:
 *       201:
 *         description: Staff created successfully
 */
staffRouter.post("/", authenticateToken, validate(createStaffSchema), asyncHandler(staffController.create));

/**
 * @swagger
 * /staff/{id}:
 *   put:
 *     summary: Update staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
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
 *             $ref: '#/components/schemas/UpdateStaffRequest'
 *     responses:
 *       200:
 *         description: Staff updated successfully
 */
staffRouter.put("/:id", authenticateToken, validate(updateStaffSchema), asyncHandler(staffController.update));

/**
 * @swagger
 * /staff/{id}:
 *   delete:
 *     summary: Delete staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Staff deleted successfully
 */
staffRouter.delete("/:id", authenticateToken, asyncHandler(staffController.delete));

export default staffRouter;
