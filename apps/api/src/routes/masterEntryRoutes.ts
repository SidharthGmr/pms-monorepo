import { Role } from "@prisma/client";
import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { MasterEntryController } from "../controllers/master-entry.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import authorization from "../middleware/authorization.middleware";
import { validate } from "../middleware/validate";
import { createMasterEntrySchema, updateMasterEntrySchema } from "../schemas/masterEntrySchema";

const masterEntryRouter = Router();
const masterEntryController = container.get<MasterEntryController>(TYPES.MasterEntryController);

const ADMIN = [Role.SUPER_ADMIN, Role.ADMIN];

/**
 * @swagger
 * tags:
 *   - name: MasterEntry
 *     description: Selectable values (S, M, L / Red, Blue) belonging to a master attribute
 */

/**
 * @swagger
 * /master-entries:
 *   get:
 *     summary: Get master entries, optionally filtered to one attribute
 *     tags: [MasterEntry]
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
 *         name: attributeCode
 *         schema:
 *           type: string
 *         example: SIZE
 *         description: Filter by the parent's stable code - the usual way to fill a dropdown
 *       - in: query
 *         name: attributeId
 *         schema:
 *           type: integer
 *         description: Filter by the parent's numeric id
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Matches entry name, value or the parent attribute's name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Published, Draft, Trash]
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
 *         description: Skip pagination - what a dropdown wants
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, value, status, displayOrder, createdAt, updatedAt]
 *         description: Defaults to createdAt. Pass displayOrder for dropdown order.
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Master entries fetched successfully
 */
masterEntryRouter.get("/", authenticateToken, asyncHandler(masterEntryController.getAll));

/**
 * @swagger
 * /master-entries/{id}:
 *   get:
 *     summary: Get a master entry by ID
 *     tags: [MasterEntry]
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
 *         description: Master entry fetched successfully
 *       404:
 *         description: Master entry not found
 */
masterEntryRouter.get("/:id", authenticateToken, asyncHandler(masterEntryController.getById));

/**
 * @swagger
 * /master-entries:
 *   post:
 *     summary: Add a value to a master attribute (admin only)
 *     tags: [MasterEntry]
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
 *               - attributeId
 *               - name
 *               - value
 *             properties:
 *               attributeId:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: Large
 *                 description: Label shown in a dropdown
 *               value:
 *                 type: string
 *                 example: L
 *                 description: Stored/compared value - unique within its attribute
 *               colorHex:
 *                 type: string
 *                 example: "#FF0000"
 *               metadata:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *               displayOrder:
 *                 type: integer
 *     description: >
 *       storeCode is inherited from the parent attribute, so a value can never be filed
 *       under a different store. A duplicate value inside one attribute returns 400.
 *     responses:
 *       201:
 *         description: Master entry created successfully
 *       403:
 *         description: Master attribute belongs to another store
 *       404:
 *         description: Master attribute not found
 */
masterEntryRouter.post(
  "/",
  authenticateToken,
  authorization(ADMIN),
  validate(createMasterEntrySchema),
  asyncHandler(masterEntryController.create)
);

/**
 * @swagger
 * /master-entries/{id}:
 *   put:
 *     summary: Update a master entry (admin only)
 *     tags: [MasterEntry]
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
 *               attributeId:
 *                 type: integer
 *               name:
 *                 type: string
 *               value:
 *                 type: string
 *               colorHex:
 *                 type: string
 *               metadata:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Master entry updated successfully
 */
masterEntryRouter.put(
  "/:id",
  authenticateToken,
  authorization(ADMIN),
  validate(updateMasterEntrySchema),
  asyncHandler(masterEntryController.update)
);

/**
 * @swagger
 * /master-entries/{id}:
 *   delete:
 *     summary: Delete a master entry (soft delete, admin only)
 *     tags: [MasterEntry]
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
 *       204:
 *         description: Master entry deleted successfully
 */
masterEntryRouter.delete("/:id", authenticateToken, authorization(ADMIN), asyncHandler(masterEntryController.delete));

export default masterEntryRouter;
