import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { ProductController } from '../controllers/product.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema, addStockSchema } from '../schemas/productSchema';

const productRouter = Router();
const productController = container.get<ProductController>(TYPES.ProductController);

/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: Product Management
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Product]
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
 *         description: Search by name or SKU
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: brandNameId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Published, Draft, Trash]
 *       - in: query
 *         name: showAllRecords
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Products fetched successfully
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
 *                     totalRecord:
 *                       type: integer
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
productRouter.get('/', authenticateToken, asyncHandler(productController.getAll));

/**
 * @swagger
 * /products/reports/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Product]
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
 *     responses:
 *       200:
 *         description: Low stock products fetched successfully
 */
productRouter.get('/reports/low-stock', authenticateToken, asyncHandler(productController.getLowStock));

/**
 * @swagger
 * /products/slug/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [Product]
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
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *       404:
 *         description: Product not found
 */
productRouter.get('/slug/:slug', authenticateToken, asyncHandler(productController.getBySlug));

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Product]
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
 *         description: Product fetched successfully
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
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
productRouter.get('/:id', authenticateToken, asyncHandler(productController.getById));


/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Client identifier (for auditing)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "iPhone 15 Pro"
 *                 description: Product name (required)
 *               slug:
 *                 type: string
 *                 minLength: 1
 *                 example: "iphone-15-pro"
 *                 description: URL-friendly slug (required, unique per store)
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Latest iPhone with A17 Pro chip"
 *                 description: Product description (optional)
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 999.99
 *                 description: Selling price (required, >= 0)
 *               cost:
 *                 type: number
 *                 minimum: 0
 *                 nullable: true
 *                 example: 750.00
 *                 description: Cost price (optional, >= 0)
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 nullable: true
 *                 example: 50
 *                 description: Available stock quantity (default 0)
 *               lowStockThreshold:
 *                 type: integer
 *                 minimum: 0
 *                 nullable: true
 *                 example: 10
 *                 description: Alert when stock falls below this value (default 5)
 *               categoryId:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *                 description: Category ID (required)
 *               brandNameId:
 *                 type: integer
 *                 minimum: 1
 *                 nullable: true
 *                 example: 3
 *                 description: Brand ID (optional)
 *               parentId:
 *                 type: integer
 *                 minimum: 1
 *                 nullable: true
 *                 example: 12
 *                 description: Parent product ID for variant/grouped products (optional)
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/image1.jpg"]
 *                 description: Array of image URLs (optional)
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *                 example: "Draft"
 *                 description: Product status (default Draft)
 *               displayOrder:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *                 description: Sorting order (optional)
 *             example:
 *               name: "iPhone 15 Pro"
 *               slug: "iphone-15-pro"
 *               categoryId: 5
 *               brandNameId: 3
 *               parentId: null
 *               description: "Latest iPhone with A17 Pro chip"
 *               price: 999.99
 *               cost: 750.00
 *               stock: 50
 *               lowStockThreshold: 10
 *               status: "Published"
 *               displayOrder: 1
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error or missing required fields
 *       401:
 *         description: Unauthorized – invalid or missing token
 *       409:
 *         description: Conflict – slug already exists for this store
 *     description: |
 *       Creates a new product.  
 *       The `storeCode` is automatically taken from the authenticated user’s token (not from the request body).  
 *       The `userId` (createdById) is also extracted from the token.
 */
productRouter.post('/', authenticateToken, validate(createProductSchema), asyncHandler(productController.create));


/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update an existing product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Client identifier
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "iPhone 15 Pro Max"
 *               slug:
 *                 type: string
 *                 minLength: 1
 *                 example: "iphone-15-pro-max"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Updated description"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 1099.99
 *               cost:
 *                 type: number
 *                 minimum: 0
 *                 nullable: true
 *                 example: 800.00
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 nullable: true
 *                 example: 60
 *               lowStockThreshold:
 *                 type: integer
 *                 minimum: 0
 *                 nullable: true
 *                 example: 15
 *               categoryId:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *               brandNameId:
 *                 type: integer
 *                 minimum: 1
 *                 nullable: true
 *                 example: 3
 *               parentId:
 *                 type: integer
 *                 minimum: 1
 *                 nullable: true
 *                 example: null
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/image_updated.jpg"]
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *                 example: "Published"
 *               displayOrder:
 *                 type: integer
 *                 nullable: true
 *                 example: 2
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error or missing fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – not enough permissions
 *       404:
 *         description: Product not found
 *       409:
 *         description: Conflict – slug already exists
 */
productRouter.put('/:id', authenticateToken, validate(updateProductSchema), asyncHandler(productController.update));


/**
 * @swagger
 * /products/{id}/stock:
 *   patch:
 *     summary: Add stock to a product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Client identifier
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *                 description: Quantity to add to the existing stock
 *               reason:
 *                 type: string
 *                 example: "Restock from supplier"
 *                 description: Reason for adding stock
 *     responses:
 *       200:
 *         description: Stock added successfully
 *       400:
 *         description: Validation error or missing fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – not enough permissions
 *       404:
 *         description: Product not found
 */
productRouter.patch('/:id/stock', authenticateToken, validate(addStockSchema), asyncHandler(productController.addStock));

/**
 * @swagger
 * /products/{id}/stock-history:
 *   get:
 *     summary: Get stock history for a product
 *     tags: [Product]
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Stock history fetched successfully
 */
productRouter.get('/:id/stock-history', authenticateToken, asyncHandler(productController.getStockHistory));

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product (soft delete — sets status to Trash)
 *     tags: [Product]
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
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
productRouter.delete('/:id', authenticateToken, asyncHandler(productController.delete));

export default productRouter;
