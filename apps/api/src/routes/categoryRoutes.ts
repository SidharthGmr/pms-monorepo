import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { CategoryController } from "../controllers/category.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";
import { categoryValidator } from "@pms/types";

const categoryRouter = Router();
const categoryController = container.get<CategoryController>(TYPES.CategoryController);

/**
 * @swagger
 * tags:
 *   - name: Category
 *     description: Category Management
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
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
 *         name: parentId
 *         schema:
 *           type: integer
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
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Include soft-deleted categories (rows with `deletedAt` set). Defaults to false.
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
 *         description: Categories fetched successfully
 */
categoryRouter.get("/", authenticateToken, asyncHandler(categoryController.getAll));

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Category]
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
 *         description: Category fetched successfully
 *       404:
 *         description: Category not found
 */
categoryRouter.get("/:id", authenticateToken, asyncHandler(categoryController.getById));

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Category]
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
 *                 example: "Electronics"
 *                 description: Category name (required)
 *               description:
 *                 type: string
 *                 example: "Electronic items and gadgets"
 *                 description: Category description (optional)
 *               parentId:
 *                 type: integer
 *                 example: 1
 *                 description: Parent category ID for nested categories (optional)
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *                 example: "Draft"
 *                 description: Category status (optional, defaults to Draft)
 *               displayOrder:
 *                 type: integer
 *                 minimum: 0
 *                 example: 1
 *                 description: Display order for sorting (optional, defaults to 0)
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 example: { "icon": "laptop", "bannerColor": "#0af" }
 *                 description: Free-form JSON for store-specific extras (optional)
 *           example:
 *             name: "Electronics"
 *             description: "Electronic items and gadgets"
 *             status: "Published"
 *             displayOrder: 1
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error, store code not found, or parent category not found in this store
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *     description: >
 *       Creates a new category. `storeCode` and `createdById` are taken from the authenticated
 *       user's token and are never read from the request body. A `parentId` must reference a
 *       category in the same store.
 */
categoryRouter.post("/", authenticateToken, validate(categoryValidator), asyncHandler(categoryController.create));
/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Category]
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
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Electronics"
 *               description:
 *                 type: string
 *                 nullable: true
 *               parentId:
 *                 type: integer
 *                 nullable: true
 *                 description: Must reference a category in the same store. Self-parenting and circular hierarchies are rejected.
 *               status:
 *                 type: string
 *                 enum: [Published, Draft]
 *               displayOrder:
 *                 type: integer
 *                 minimum: 0
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation error, or the parent would create a circular hierarchy
 *       404:
 *         description: Category not found
 *     description: >
 *       `storeCode` is always taken from the token, so a category cannot be moved to another
 *       store. `updatedById` is recorded automatically.
 */
categoryRouter.put("/:id", authenticateToken, validate(categoryValidator), asyncHandler(categoryController.update));

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Category]
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
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category still has sub-categories or products and cannot be deleted
 *     description: >
 *       Soft delete - sets `deletedAt` and `deletedById` rather than removing the row. Deleted
 *       categories are hidden from the list unless `includeDeleted=true` is passed to GET
 *       /categories. Rejected with 409 while sub-categories or products still reference it.
 */
categoryRouter.delete("/:id", authenticateToken, asyncHandler(categoryController.delete));

export default categoryRouter;

