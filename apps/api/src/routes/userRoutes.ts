import { Router } from 'express';
import { authenticateToken } from '../middleware/authentication.middleware';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { UserController } from '../controllers/user.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import authorization from '../middleware/authorization.middleware';
import { validate } from '../middleware/validate';
import { updateRoleSchema, updateProfileSchema, superAdminUpdateRoleSchema } from '../schemas/userSchema';
import { Role } from '@prisma/client';

const userRouter = Router();
const usersController = container.get<UserController>(TYPES.UserController);

/**
 * @swagger
 * tags:
 *     - name: User
 *       description: User Management
 */

/**
 * @swagger
 * /users/:
 *   get:
 *     summary: Get all users
 *     tags: [User]
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
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         required: false
 *         description: Filter users by email
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter users by user ID
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, USER, STAFF]
 *         required: false
 *         description: Filter users by role
 *       - in: query
 *         name: storeCode
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter users by store code
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter users by phone number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number for pagination (optional)
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of records per page (optional)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search term to filter users by name, email, username, or phone (optional)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Published, Draft, Trash]
 *         required: false
 *         description: Filter by status (optional)
 *       - in: query
 *         name: showAllRecords
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Show all records without pagination (optional)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: Filter by start date (optional)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: Filter by end date (optional)
 *       - in: query
 *         name: isActive
 *         schema:
 *          type: boolean
 *          required: false
 *          description: Filter users by active status
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
userRouter.get('/', authenticateToken, asyncHandler(usersController.getAllUsers));

/**
 * @swagger
 * /users/email/{email}:
 *   get:
 *     summary: Get a user by email
 *     tags: [User]
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
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         example: websidharth@gmail.com
 *         description: The user email
 *     responses:
 *       200:
 *         description: The user description by email
 *       404:
 *         description: User not found
 */
userRouter.get('/email/:email', authenticateToken, asyncHandler(usersController.getUserByEmail));

/**
 * @swagger
 * /users/role/{userId}:
 *   put:
 *     summary: Update User Role
 *     tags: [User]
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
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, USER, STAFF]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Bad request - missing or invalid role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not enough permissions
 *       404:
 *         description: User not found
 */
userRouter.put('/role/:userId', authenticateToken, authorization([Role.SUPER_ADMIN, Role.ADMIN]), validate(updateRoleSchema), asyncHandler(usersController.updateRole));

/**
 * @swagger
 * /users/super-admin/update:
 *   put:
 *     summary: Super admin updates user role/status by email, userId, or phone
 *     tags: [User]
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
 *             oneOf:
 *               - required: [email]
 *               - required: [userId]
 *               - required: [phone]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               userId:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, USER, STAFF]
 *               status:
 *                 type: string
 *                 enum: [Published, Draft, Trash]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request - missing identifier or update field
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only super admin can access
 *       404:
 *         description: User not found
 */
userRouter.put('/super-admin/update', authenticateToken, authorization([Role.SUPER_ADMIN]), validate(superAdminUpdateRoleSchema), asyncHandler(usersController.superAdminUpdateRole));

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update User Profile
 *     tags: [User]
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
 *             properties:
 *               name:
 *                 type: string
 *               userName:
 *                 type: string
 *               phone:
 *                 type: string
 *               profileImageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

userRouter.put('/profile', authenticateToken, validate(updateProfileSchema), asyncHandler(usersController.updateProfile));

/**
 * @swagger
 * /users/assign-store:
 *   patch:
 *     summary: Assign a store to the current authenticated user
 *     tags: [User]
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
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: number
 *                 example: 1
 *                 description: The ID of the store to assign
 *     responses:
 *       200:
 *         description: Store assigned successfully
 *       400:
 *         description: Bad request - missing storeId
 *       404:
 *         description: Store not found
 *       401:
 *         description: Unauthorized
 */
userRouter.patch('/assign-store', authenticateToken, asyncHandler(usersController.assignStore));




/**
 * @swagger
 * /users/status/{userId}:
 *   put:
 *     summary: Update User Status
 *     tags: [User]
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
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
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
 *                 enum: [Published, Draft, Deleted]
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Bad request - missing or invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not enough permissions
 *       404:
 *         description: User not found
 */
userRouter.put('/status/:userId', authenticateToken, authorization([Role.SUPER_ADMIN, Role.ADMIN]), asyncHandler(usersController.updateStatusById));


/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [User]
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
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The user description by id
 *       404:
 *         description: User not found
 */
userRouter.get('/:userId', authenticateToken, asyncHandler(usersController.getUserById));

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Update User
 *     tags: [User]
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
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               userName:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               profileImageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

userRouter.put('/:userId', authenticateToken, authorization([Role.SUPER_ADMIN, Role.ADMIN]), asyncHandler(usersController.updateUserById));

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [User]
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
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The user description by id
 *       404:
 *         description: User not found
 */

userRouter.delete('/:userId', authenticateToken, authorization([Role.SUPER_ADMIN, Role.ADMIN]), asyncHandler(usersController.deleteUserById));

export default userRouter;
