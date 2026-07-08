import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { BrandNameController } from "../controllers/brand-name.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";
import { createBrandNameSchema, updateBrandNameSchema } from "../schemas/brandNameSchema";

const brandNameRouter = Router();
const brandNameController = container.get<BrandNameController>(TYPES.BrandNameController);

/**
 * @swagger
 * tags:
 *   - name: BrandName
 *     description: Brand Name Management
 */

/**
 * @swagger
 * /brand-names:
 *   get:
 *     summary: Get all brand names
 *     tags: [BrandName]
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
 *         description: Search term to filter brand names (optional)
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
 *       - in: query
 *         name: categoryIds
 *         schema:
 *           type: string
 *         required: false
 *         description: Comma-separated category IDs to filter brand names (optional)
 *     responses:
 *       200:
 *         description: Brand names fetched successfully
 */
brandNameRouter.get("/", authenticateToken, asyncHandler(brandNameController.getAll));

/**
 * @swagger
 * /brand-names/{id}:
 *   get:
 *     summary: Get brand name by ID
 *     tags: [BrandName]
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
 *         description: Brand name fetched successfully
 *       404:
 *         description: Brand name not found
 */
brandNameRouter.get("/:id", authenticateToken, asyncHandler(brandNameController.getById));

/**
* @swagger
* /brand-names:
*   post:
*     summary: Create a new brand name
*     tags: [BrandName]
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
*                 example: "Nike"
*                 description: Brand name (required)
*               status:
*                 type: string
*                 enum: [Published, Draft, Trash]
*                 example: "Published"
*                 description: Brand status (optional, defaults to Draft)
*               displayOrder:
*                 type: integer
*                 example: 1
*                 description: Display order for sorting (optional)
*           example:
*             name: "Nike"
*             status: "Published"
*             displayOrder: 1
*     responses:
*       201:
*         description: Brand name created successfully
*       400:
*         description: Validation error or store code not found
*       401:
*         description: Unauthorized - Invalid or missing token
*       409:
*         description: Conflict - Brand name already exists
*     description: Creates a new brand name. The storeCode is automatically taken from the authenticated user's token.
*/
brandNameRouter.post("/", authenticateToken, validate(createBrandNameSchema), asyncHandler(brandNameController.create));

/**
 * @swagger
 * /brand-names/{id}:
 *   put:
 *     summary: Update a brand name
 *     tags: [BrandName]
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
 *               brandName:
 *                 type: string
 *               status:
 *                 type: boolean
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Brand name updated successfully
 */
brandNameRouter.put("/:id", authenticateToken, validate(updateBrandNameSchema), asyncHandler(brandNameController.update));

/**
 * @swagger
 * /brand-names/{id}:
 *   delete:
 *     summary: Delete a brand name (soft delete)
 *     tags: [BrandName]
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
 *         description: Brand name deleted successfully
 */
brandNameRouter.delete("/:id", authenticateToken, asyncHandler(brandNameController.delete));

export default brandNameRouter;
