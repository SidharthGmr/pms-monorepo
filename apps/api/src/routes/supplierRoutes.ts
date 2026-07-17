import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { SupplierController } from "../controllers/supplier.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";
import { createSupplierSchema, updateSupplierSchema } from "../schemas/supplierSchema";

const supplierRouter = Router();
const supplierController = container.get<SupplierController>(TYPES.SupplierController);

/**
 * @swagger
 * tags:
 *   - name: Supplier
 *     description: Supplier Management
 */

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Supplier]
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
 *         required: false
 *         description: Page number for pagination (optional)
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of records per page (optional)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search term to filter suppliers (optional)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Published, Draft, Trash]
 *         required: false
 *         description: Filter by status (optional)
 *       - in: query
 *         name: showAllRecords
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Show all records without pagination (optional)
 *     responses:
 *       200:
 *         description: Suppliers fetched successfully
 */
supplierRouter.get("/", authenticateToken, asyncHandler(supplierController.getAll));

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Supplier]
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
 *         description: Supplier fetched successfully
 *       404:
 *         description: Supplier not found
 */
supplierRouter.get("/:id", authenticateToken, asyncHandler(supplierController.getById));

/**
 * @swagger
 * /suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Supplier]
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Acme Corp"
 *               contactPerson:
 *                 type: string
 *                 example: "Jane Doe"
 *               email:
 *                 type: string
 *                 example: "jane@acme.com"
 *               phone:
 *                 type: string
 *                 example: "+1 555 123 4567"
 *               address:
 *                 type: string
 *                 example: "123 Market St"
 *               notes:
 *                 type: string
 *                 example: "Preferred supplier for electronics"
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *                 example: "Published"
 *               displayOrder:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *       400:
 *         description: Validation error or store code not found
 *     description: Creates a new supplier. The storeCode is automatically taken from the authenticated user's token.
 */
supplierRouter.post("/", authenticateToken, validate(createSupplierSchema), asyncHandler(supplierController.create));

/**
 * @swagger
 * /suppliers/{id}:
 *   put:
 *     summary: Update a supplier
 *     tags: [Supplier]
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
 *               contactPerson:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 */
supplierRouter.put("/:id", authenticateToken, validate(updateSupplierSchema), asyncHandler(supplierController.update));

/**
 * @swagger
 * /suppliers/{id}:
 *   delete:
 *     summary: Delete a supplier (soft delete)
 *     tags: [Supplier]
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
 *         description: Supplier deleted successfully
 */
supplierRouter.delete("/:id", authenticateToken, asyncHandler(supplierController.delete));

export default supplierRouter;
