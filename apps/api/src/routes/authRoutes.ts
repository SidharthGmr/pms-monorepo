// export default router;

import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { AccountController } from "../controllers/auth.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";
import { createUserByAdminSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema, verifyOtpSchema, verifyOtpByIdSchema, sendOtpSchema, verifyEmailTokenSchema } from "../schemas/userSchema";
import { authLimiter } from "../middleware/rateLimiter.middleware";
import authorization from "../middleware/authorization.middleware";
import { Role } from "../enum/user.enum";

const accountRouter = Router();

const accountController = container.get<AccountController>(
  TYPES.AccountController
);

/**
 * @swagger
 * tags:
 *   - name: Account
 *     description: Authentication
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Account]
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
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: sunil@gmrwebteam.com
 *               password:
 *                 type: string
 *                 example: "Admin123!@#"
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Validation error 
 *       401:
 *         description: Invalid email or password
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
accountRouter.post("/login", authLimiter, validate(loginSchema), asyncHandler(accountController.login));

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create User
 *     tags: [Account]
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
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: "Admin123!@#"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               isRegisteredByShop:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Created
 *       401:
 *         description: Invalid email or password
 *       409:
 *         description: Email already exists
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
accountRouter.post("/signup", authLimiter, validate(signupSchema), asyncHandler(accountController.signup));

/**
 * @swagger
 * /auth/create-user:
 *   post:
 *     summary: Create User by Admin
 *     tags: [Account]
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
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *               role: { type: string, enum: [SUPER_ADMIN, ADMIN, USER, STAFF] }
 *     responses:
 *       201:
 *         description: User created successfully by admin
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not enough permissions
 *       409:
 *         description: User already exists
 */
accountRouter.post('/create-user', authenticateToken, authorization([Role.SUPER_ADMIN, Role.ADMIN]), validate(createUserByAdminSchema), asyncHandler(accountController.createUser));


/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout the current user
 *     tags: [Account]
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
accountRouter.post("/logout", authenticateToken, asyncHandler(accountController.logout));

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh JWT Token
 *     tags: [Account]
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
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "refresh-token-value"
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
accountRouter.post("/refresh-token", authenticateToken, asyncHandler(accountController.refreshToken));


/**
 * @swagger
 * /auth/otp/send:
 *   post:
 *     summary: Send OTP (by email/userId in body, or from JWT token)
 *     tags: [Account]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
accountRouter.post("/otp/send", authLimiter, validate(sendOtpSchema), asyncHandler(accountController.sendVerificationOtp));

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Account]
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
 *               - otp
 *             oneOf:
 *               - required: [email]
 *               - required: [userId]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email
 *               userId:
 *                 type: string
 *                 description: User ID
 *               otp:
 *                 type: string
 *                 example: "7452"
 *                 description: OTP received on email
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP or expired OTP
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
accountRouter.post("/verify-otp", authLimiter, validate(verifyOtpSchema), asyncHandler(accountController.otpVerify));

/**
 * @swagger
 * /auth/verify-token:
 *   post:
 *     tags: [Account]
 *     summary: Verify a user's email using the signup token
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
 *               - token 
 *             properties:
 *               token:
 *                 type: string
 *                 description: The token issued to the user at signup 
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       401:
 *         description: Invalid or expired verification token
 *       404:
 *         description: User not found
 */
accountRouter.post("/verify-token", authLimiter, validate(verifyEmailTokenSchema), asyncHandler(accountController.verifyToken));


/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset link by email
 *     tags: [Account]
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
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: If the email exists, a password reset link has been sent
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
accountRouter.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), asyncHandler(accountController.forgotPassword));


/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using the emailed reset token
 *     tags: [Account]
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
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: The reset token from the emailed reset link
 *               newPassword:
 *                 type: string
 *                 example: "NewStrong@123"
 *               confirmPassword:
 *                 type: string
 *                 example: "NewStrong@123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Password mismatch or validation error
 *       401:
 *         description: Invalid or expired reset token
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
accountRouter.post("/reset-password", authLimiter, validate(resetPasswordSchema), asyncHandler(accountController.resetPassword));



export default accountRouter;
