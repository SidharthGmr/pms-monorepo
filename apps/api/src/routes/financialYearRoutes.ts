import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { FinancialYearController } from '../controllers/financial-year.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import authorization from '../middleware/authorization.middleware';
import { validate } from '../middleware/validate';
import { financialYearValidator } from '@pms/types';
import { Role } from '@prisma/client';

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

const financialYearRouter = Router();
const financialYearController = container.get<FinancialYearController>(TYPES.FinancialYearController);

/**
 * @swagger
 * tags:
 *   - name: FinancialYear
 *     description: Accounting periods - a posting date resolves to the year it falls in
 */

/**
 * @swagger
 * /financial-years:
 *   post:
 *     summary: Create a financial year
 *     description: storeCode is taken from the authenticated user's token. A store's years may not overlap.
 *     tags: [FinancialYear]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startDate, endDate]
 *             properties:
 *               name: { type: string, example: "FY 2026-27" }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: The created year
 *       400:
 *         description: Validation failed, the dates overlap another year, or the name is already used in this store
 */
financialYearRouter.post('/', authenticateToken, authorization(ADMIN_ROLES), validate(financialYearValidator), asyncHandler(financialYearController.create));

/**
 * @swagger
 * /financial-years:
 *   get:
 *     summary: List financial years
 *     tags: [FinancialYear]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: recordPerPage
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: showAllRecords
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [name, startDate, endDate, isClosed, createdAt, id] }
 *       - in: query
 *         name: sortDirection
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: A page of financial years
 */
financialYearRouter.get('/', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(financialYearController.getAll));

/**
 * @swagger
 * /financial-years/{id}:
 *   get:
 *     summary: Get one financial year
 *     tags: [FinancialYear]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: The year, with how many vouchers were posted into it
 *       400:
 *         description: The id is not a number, or the token carries no store code
 *       404:
 *         description: No such financial year in this store
 */
financialYearRouter.get('/:id', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(financialYearController.getById));

/**
 * @swagger
 * /financial-years/{id}:
 *   put:
 *     summary: Update a financial year
 *     description: The new range must still contain every voucher already posted into the year.
 *     tags: [FinancialYear]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startDate, endDate]
 *             properties:
 *               name: { type: string }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: The updated year
 *       400:
 *         description: The year is closed, the dates overlap another year, the name is taken, or posted vouchers would fall outside
 *       404:
 *         description: No such financial year in this store
 */
financialYearRouter.put('/:id', authenticateToken, authorization(ADMIN_ROLES), validate(financialYearValidator), asyncHandler(financialYearController.update));

/**
 * @swagger
 * /financial-years/{id}:
 *   delete:
 *     summary: Delete a financial year
 *     tags: [FinancialYear]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: The deleted year
 *       400:
 *         description: The year already has posted vouchers
 *       404:
 *         description: No such financial year in this store
 */
financialYearRouter.delete('/:id', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(financialYearController.delete));

/**
 * @swagger
 * /financial-years/{id}/closed:
 *   patch:
 *     summary: Close or reopen a financial year
 *     description: Nothing can be posted into a closed year, which is what makes a filed period safe to keep.
 *     tags: [FinancialYear]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isClosed]
 *             properties:
 *               isClosed: { type: boolean }
 *     responses:
 *       200:
 *         description: The year in its new state
 *       400:
 *         description: The year is already in that state
 *       401:
 *         description: The token carries no user id
 *       404:
 *         description: No such financial year in this store
 */
financialYearRouter.patch('/:id/closed', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(financialYearController.setClosed));

export default financialYearRouter;
