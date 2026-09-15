import { Role } from '@prisma/client';
import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { BrandNameController } from '../controllers/brand-name.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import authorization from '../middleware/authorization.middleware';
import { storeRequiredMiddleware } from '../middleware/store-required.middleware';
import { validate } from '../middleware/validate';
import { createBrandNameSchema, updateBrandNameSchema } from '../schemas/brandNameSchema';

const brandNameRouter = Router();
const brandNameController = container.get<BrandNameController>(TYPES.BrandNameController);

const STAFF_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

/**
 * @swagger
 * tags:
 *   - name: BrandName
 *     description: Brand Name Management
 */

/**
 * @swagger
 * /brand-names:
 *   post:
 *     summary: Create a new brand name
 *     description: storeCode is taken from the authenticated user's token, never from the body.
 *     tags: [BrandName]
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
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Brand name created successfully
 *       400:
 *         description: Validation failed, or a brand name with this name already exists in the store
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 */
brandNameRouter.post(
  '/',
  authenticateToken,
  authorization(STAFF_ROLES),
  storeRequiredMiddleware,
  validate(createBrandNameSchema),
  asyncHandler(brandNameController.create)
);

/**
 * @swagger
 * /brand-names:
 *   get:
 *     summary: Get all brand names
 *     description: Scoped to the authenticated user's store.
 *     tags: [BrandName]
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
 *         name: categoryIds
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         required: false
 *     responses:
 *       200:
 *         description: Brand names fetched successfully
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: The user has no store assigned
 */
brandNameRouter.get('/', authenticateToken, storeRequiredMiddleware, asyncHandler(brandNameController.getAll));

/**
 * @swagger
 * /brand-names/{id}:
 *   get:
 *     summary: Get brand name by ID
 *     description: A brand name belonging to another store is reported as 404.
 *     tags: [BrandName]
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
 *         description: Brand name fetched successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: The user has no store assigned
 *       404:
 *         description: Brand name not found
 */
brandNameRouter.get('/:id', authenticateToken, storeRequiredMiddleware, asyncHandler(brandNameController.getById));

/**
 * @swagger
 * /brand-names/{id}:
 *   put:
 *     summary: Update a brand name
 *     description: storeCode cannot be changed through this endpoint; the row stays in the caller's store.
 *     tags: [BrandName]
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
 *             properties:
 *               name:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Brand name updated successfully
 *       400:
 *         description: Invalid id, validation failed, or the new name already exists in the store
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 *       404:
 *         description: Brand name not found
 */
brandNameRouter.put(
  '/:id',
  authenticateToken,
  authorization(STAFF_ROLES),
  storeRequiredMiddleware,
  validate(updateBrandNameSchema),
  asyncHandler(brandNameController.update)
);

/**
 * @swagger
 * /brand-names/{id}:
 *   delete:
 *     summary: Delete a brand name
 *     description: Soft delete - sets status to Trash. Responds 204, so the body is dropped in transit.
 *     tags: [BrandName]
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
 *       204:
 *         description: Brand name deleted successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: Not enough permissions, or the user has no store assigned
 *       404:
 *         description: Brand name not found
 */
brandNameRouter.delete(
  '/:id',
  authenticateToken,
  authorization(STAFF_ROLES),
  storeRequiredMiddleware,
  asyncHandler(brandNameController.delete)
);

export default brandNameRouter;
