import { Role } from "@prisma/client";
import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { ReviewController } from "../controllers/review.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import authorization from "../middleware/authorization.middleware";
import { validate } from "../middleware/validate";
import { createReviewSchema, updateReviewSchema } from "../schemas/reviewSchema";

const reviewRouter = Router();
const reviewController = container.get<ReviewController>(TYPES.ReviewController);

/**
 * @swagger
 * tags:
 *   - name: Review
 *     description: Product reviews. Customers manage their own; staff moderate.
 */

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get reviews (customers see only their own; staff see all)
 *     tags: [Review]
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
 *         description: Matches review title/comment, product name or reviewer name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Published, Draft, Trash]
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Staff only - ignored for customers, who are pinned to their own reviews
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: isVerified
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rating, createdAt, updatedAt, status, isVerified]
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Reviews fetched successfully
 */
reviewRouter.get("/", authenticateToken, asyncHandler(reviewController.getAll));

/**
 * @swagger
 * /reviews/summary/{productId}:
 *   get:
 *     summary: Average rating and per-star counts for a product
 *     tags: [Review]
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
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review summary fetched successfully
 */
reviewRouter.get("/summary/:productId", authenticateToken, asyncHandler(reviewController.getSummary));

/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     summary: Get a review by ID
 *     tags: [Review]
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
 *         description: Review fetched successfully
 *       404:
 *         description: Review not found
 */
reviewRouter.get("/:id", authenticateToken, asyncHandler(reviewController.getById));

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Write a review for a purchased product
 *     tags: [Review]
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
 *               - orderId
 *               - productId
 *               - rating
 *             properties:
 *               orderId:
 *                 type: integer
 *                 example: 12
 *               productId:
 *                 type: integer
 *                 example: 4
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               title:
 *                 type: string
 *                 example: "Exactly as described"
 *               comment:
 *                 type: string
 *                 example: "Arrived quickly and works well."
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     description: >
 *       The order must belong to the caller and contain the product, otherwise 403.
 *       `isVerified` is set automatically when that order is DELIVERED. One review
 *       per (order, product, user) - a repeat returns 400 from the unique constraint.
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Validation error or duplicate review
 *       403:
 *         description: Product was not purchased on one of your orders
 */
reviewRouter.post("/", authenticateToken, validate(createReviewSchema), asyncHandler(reviewController.create));

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Edit a review (owner) or moderate its status (staff)
 *     tags: [Review]
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
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *                 description: Staff only
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: Not your review, or status change attempted by a customer
 */
reviewRouter.put("/:id", authenticateToken, validate(updateReviewSchema), asyncHandler(reviewController.update));

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review (soft delete to Trash) - owner or staff
 *     tags: [Review]
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
 *       204:
 *         description: Review deleted successfully
 *       403:
 *         description: Not your review
 */
reviewRouter.delete("/:id", authenticateToken, asyncHandler(reviewController.delete));

/**
 * @swagger
 * /reviews/moderate/{id}:
 *   patch:
 *     summary: Moderate a review's status (staff only)
 *     tags: [Review]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: Forbidden - staff only
 */
reviewRouter.patch(
  "/moderate/:id",
  authenticateToken,
  authorization([Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF]),
  validate(updateReviewSchema),
  asyncHandler(reviewController.update)
);

export default reviewRouter;
