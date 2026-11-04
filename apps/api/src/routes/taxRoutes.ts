import { TaxValidator } from '@pms/types';
import { Role } from '@prisma/client';
import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { TaxController } from '../controllers/tax.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import authorization from '../middleware/authorization.middleware';
import { validate } from '../middleware/validate';

const taxRouter = Router();
const taxController = container.get<TaxController>(TYPES.TaxController);

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

/**
 * @swagger
 * tags:
 *   - name: Tax
 *     description: Tax Management. Taxes are platform-wide reference data, not scoped to a store.
 */

/**
 * @swagger
 * /taxes:
 *   post:
 *     summary: Create a new tax
 *     tags: [Tax]
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
 *             required: [name, code, rate]
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               rate:
 *                 type: number
 *                 example: 18.00
 *               category:
 *                 type: string
 *                 enum: [TAXABLE, EXEMPT, ZERO_RATED, NON_GST]
 *               isActive:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tax created successfully
 *       400:
 *         description: Validation failed, or a tax with this code already exists
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: Not enough permissions
 */
taxRouter.post('/', authenticateToken, authorization(ADMIN_ROLES), validate(TaxValidator), asyncHandler(taxController.create));

/**
 * @swagger
 * /taxes:
 *   get:
 *     summary: Get all taxes
 *     tags: [Tax]
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
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [TAXABLE, EXEMPT, ZERO_RATED, NON_GST]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: showAllRecords
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Taxes fetched successfully
 *       401:
 *         description: Missing or expired access token
 */
taxRouter.get('/', authenticateToken, asyncHandler(taxController.getAll));

/**
 * @swagger
 * /taxes/{id}:
 *   get:
 *     summary: Get tax by ID
 *     tags: [Tax]
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
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tax fetched successfully
 *       401:
 *         description: Missing or expired access token
 *       404:
 *         description: Tax not found
 */
taxRouter.get('/:id', authenticateToken, asyncHandler(taxController.getById));

/**
 * @swagger
 * /taxes/{id}:
 *   put:
 *     summary: Update a tax
 *     tags: [Tax]
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
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code, rate]
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               rate:
 *                 type: number
 *                 example: 18.00
 *               category:
 *                 type: string
 *                 enum: [TAXABLE, EXEMPT, ZERO_RATED, NON_GST]
 *               isActive:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tax updated successfully
 *       400:
 *         description: Validation failed, or a tax with this code already exists
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: Not enough permissions
 *       404:
 *         description: Tax not found
 */
taxRouter.put('/:id', authenticateToken, authorization(ADMIN_ROLES), validate(TaxValidator), asyncHandler(taxController.update));

/**
 * @swagger
 * /taxes/{id}:
 *   delete:
 *     summary: Delete a tax (soft delete)
 *     tags: [Tax]
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
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tax deleted successfully
 *       401:
 *         description: Missing or expired access token
 *       403:
 *         description: Not enough permissions
 *       404:
 *         description: Tax not found
 */
taxRouter.delete('/:id', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(taxController.delete));

export default taxRouter;
