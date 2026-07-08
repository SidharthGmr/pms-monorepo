import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { PurchaseController } from '../controllers/purchase.controller';
import { authenticateToken } from '../middleware/authentication.middleware';
import { validate } from '../middleware/validate';
import { createPurchaseSchema } from '../schemas/purchaseSchema';

const router = Router();
const purchaseController = container.get<PurchaseController>(TYPES.PurchaseController);


/**
 * @swagger
 * tags:
 *   - name: Purchase
 *     description: Purchase / Receive Stock Management
 */

/**
 * @swagger
 * /purchases:
 *   post:
 *     summary: Create a new purchase (Bulk add stock)
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Client identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totalAmount
 *               - items
 *             properties:
 *               invoiceNumber:
 *                 type: string
 *               invoiceUrl:
 *                 type: string
 *               supplierName:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *               purchaseDate:
 *                 type: string
 *                 format: date-time
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     unitCost:
 *                       type: number
 *                     totalCost:
 *                       type: number
 *     responses:
 *       201:
 *         description: Purchase created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  authenticateToken,
  validate(createPurchaseSchema),
  (req, res) => purchaseController.create(req, res)
);

/**
 * @swagger
 * /purchases:
 *   get:
 *     summary: Get all purchases
 *     tags: [Purchase]
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
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchases fetched successfully
 */
router.get(
  '/',
  authenticateToken,
  (req, res) => purchaseController.getAllPurchases(req, res)
);

/**
 * @swagger
 * /purchases/{id}:
 *   get:
 *     summary: Get purchase by ID
 *     tags: [Purchase]
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
 *         description: Purchase fetched successfully
 *       404:
 *         description: Purchase not found
 */
router.get(
  '/:id',
  authenticateToken,
  (req, res) => purchaseController.getPurchaseById(req, res)
);

export default router;
