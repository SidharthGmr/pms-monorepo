import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { DashboardController } from '../controllers/dashboard.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';

const dashboardRouter = Router();
const dashboardController = container.get<DashboardController>(TYPES.DashboardController);

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Dashboard summary data
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get dashboard summary (recent 5 records + total for Products, Attributes, ProductVariants, ProductAttributes)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *     responses:
 *       200:
 *         description: Dashboard summary fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         recent:
 *                           type: array
 *                           items:
 *                             type: object
 *                     attributes:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         recent:
 *                           type: array
 *                           items:
 *                             type: object
 *                     productVariants:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         recent:
 *                           type: array
 *                           items:
 *                             type: object
 *                     productAttributes:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         recent:
 *                           type: array
 *                           items:
 *                             type: object
 */
dashboardRouter.get('/summary', authenticateToken, asyncHandler(dashboardController.getSummary));

export default dashboardRouter;
