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
 *                 example: 1
 *                 description: Display order for sorting (optional)
 *           example:
 *             name: "Electronics"
 *             description: "Electronic items and gadgets"
 *             status: "Published"
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error or store code not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *     description: Creates a new category. The storeCode is automatically taken from the authenticated user's token.
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parentId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Category updated successfully
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
 */
categoryRouter.delete("/:id", authenticateToken, asyncHandler(categoryController.delete));

export default categoryRouter;

