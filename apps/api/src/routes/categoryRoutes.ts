import { Role } from '@prisma/client';
import { categoryValidator } from '@pms/types';
import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { CategoryController } from '../controllers/category.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import authorization from '../middleware/authorization.middleware';
import { storeRequiredMiddleware } from '../middleware/store-required.middleware';
import { validate } from '../middleware/validate';

const categoryRouter = Router();
const categoryController = container.get<CategoryController>(TYPES.CategoryController);

const STAFF_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

/**
 * @swagger
 * tags:
 *   - name: Category
 *     description: Category Management
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     description: storeCode and createdById are taken from the authenticated user's token, never from the body.
 *     tags: [Category]
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
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               parentId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *               displayOrder:
 *                 type: integer
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation failed, or the parent category does not exist in this store
 *       401:
 *         description: Missing or expired access token, or no userId on the token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 */
categoryRouter.post(
  '/',
  authenticateToken,
  authorization(STAFF_ROLES),
  storeRequiredMiddleware,
  validate(categoryValidator),
  asyncHandler(categoryController.create)
);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     description: Scoped to the authenticated user's store.
 *     tags: [Category]
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, status, displayOrder, createdAt, updatedAt]
 *         required: false
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         required: false
 *     responses:
 *       200:
 *         description: Categories fetched successfully
 *       400:
 *         description: The user has no store assigned
 *       401:
 *         description: Missing or expired access token, or no userId on the token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 */
categoryRouter.get('/', authenticateToken, storeRequiredMiddleware, asyncHandler(categoryController.getAll));

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: A category belonging to another store is reported as 404.
 *     tags: [Category]
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
 *         description: Category fetched successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Missing or expired access token, or no userId on the token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 *       404:
 *         description: Category not found
 */
categoryRouter.get('/:id', authenticateToken, storeRequiredMiddleware, asyncHandler(categoryController.getById));

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category
 *     description: Omitted optional fields are left unchanged; storeCode cannot be changed through this endpoint.
 *     tags: [Category]
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
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               parentId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *               displayOrder:
 *                 type: integer
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid id, validation failed, a parent outside this store, self-parenting, or a circular hierarchy
 *       401:
 *         description: Missing or expired access token, or no userId on the token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 *       404:
 *         description: Category not found
 */
categoryRouter.put(
  '/:id',
  authenticateToken,
  authorization(STAFF_ROLES),
  storeRequiredMiddleware,
  validate(categoryValidator),
  asyncHandler(categoryController.update)
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     description: Soft delete - stamps deletedAt and deletedById. Refused while sub-categories or products still reference it.
 *     tags: [Category]
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
 *         description: Category deleted successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Missing or expired access token, or no userId on the token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 *       404:
 *         description: Category not found
 *       409:
 *         description: The category still has sub-categories or products
 */
categoryRouter.delete(
  '/:id',
  authenticateToken,
  authorization(STAFF_ROLES),
  storeRequiredMiddleware,
  asyncHandler(categoryController.delete)
);

export default categoryRouter;
