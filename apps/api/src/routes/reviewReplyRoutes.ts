import { Role } from "@prisma/client";
import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { ReviewReplyController } from "../controllers/review-reply.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import authorization from "../middleware/authorization.middleware";
import { validate } from "../middleware/validate";
import { createReviewReplySchema, updateReviewReplySchema } from "../schemas/reviewSchema";

const reviewReplyRouter = Router();
const reviewReplyController = container.get<ReviewReplyController>(TYPES.ReviewReplyController);

// Writing a reply is the shop answering a customer, so every mutating route is
// staff-only. Reading is open to any signed-in user - replies are shown publicly
// underneath the review they answer.
const STAFF = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

/**
 * @swagger
 * tags:
 *   - name: ReviewReply
 *     description: Staff replies to product reviews
 */

/**
 * @swagger
 * /review-replies:
 *   get:
 *     summary: Get review replies
 *     tags: [ReviewReply]
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
 *         name: reviewId
 *         schema:
 *           type: integer
 *         description: Usually the only filter you need
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *       - in: query
 *         name: showAllRecords
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Defaults to ASC so a thread reads oldest-first
 *     responses:
 *       200:
 *         description: Review replies fetched successfully
 */
reviewReplyRouter.get("/", authenticateToken, asyncHandler(reviewReplyController.getAll));

/**
 * @swagger
 * /review-replies/{id}:
 *   get:
 *     summary: Get a reply by ID
 *     tags: [ReviewReply]
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
 *         description: Review reply fetched successfully
 *       404:
 *         description: Review reply not found
 */
reviewReplyRouter.get("/:id", authenticateToken, asyncHandler(reviewReplyController.getById));

/**
 * @swagger
 * /review-replies:
 *   post:
 *     summary: Reply to a review (staff only)
 *     tags: [ReviewReply]
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
 *               - reviewId
 *               - comment
 *             properties:
 *               reviewId:
 *                 type: integer
 *                 example: 7
 *               comment:
 *                 type: string
 *                 example: "Thanks for the feedback - glad it arrived safely!"
 *     responses:
 *       201:
 *         description: Reply added successfully
 *       403:
 *         description: Forbidden - staff only
 *       404:
 *         description: Review not found
 */
reviewReplyRouter.post("/", authenticateToken, authorization(STAFF), validate(createReviewReplySchema), asyncHandler(reviewReplyController.create));

/**
 * @swagger
 * /review-replies/{id}:
 *   put:
 *     summary: Edit a reply (author, or any admin)
 *     tags: [ReviewReply]
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
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reply updated successfully
 *       403:
 *         description: Not your reply
 */
reviewReplyRouter.put("/:id", authenticateToken, authorization(STAFF), validate(updateReviewReplySchema), asyncHandler(reviewReplyController.update));

/**
 * @swagger
 * /review-replies/{id}:
 *   delete:
 *     summary: Delete a reply (author, or any admin)
 *     tags: [ReviewReply]
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
 *         description: Reply deleted successfully
 *       403:
 *         description: Not your reply
 */
reviewReplyRouter.delete("/:id", authenticateToken, authorization(STAFF), asyncHandler(reviewReplyController.delete));

export default reviewReplyRouter;
