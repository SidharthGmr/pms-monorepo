import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { StaffSalaryController } from "../controllers/staff-salary.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";
import { createStaffSalarySchema, updateStaffSalarySchema } from "../schemas/staffSalarySchema";

const staffSalaryRouter = Router();
const staffSalaryController = container.get<StaffSalaryController>(TYPES.StaffSalaryController);

/**
 * @swagger
 * tags:
 *   - name: StaffSalary
 *     description: Staff Salary Management
 */

/**
 * @swagger
 * /staff-salaries:
 *   get:
 *     summary: Get all staff salary records
 *     tags: [StaffSalary]
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
 *         description: Staff salaries fetched successfully
 */
staffSalaryRouter.get("/", authenticateToken, asyncHandler(staffSalaryController.getAll));

/**
 * @swagger
 * /staff-salaries/staff/{staffId}:
 *   get:
 *     summary: Get salary records by staff ID
 *     tags: [StaffSalary]
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
 *         name: staffId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Staff salaries fetched successfully
 */
staffSalaryRouter.get("/staff/:staffId", authenticateToken, asyncHandler(staffSalaryController.getByStaffId));

/**
 * @swagger
 * /staff-salaries/{id}:
 *   get:
 *     summary: Get staff salary by ID
 *     tags: [StaffSalary]
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
 *         description: Staff salary fetched successfully
 *       404:
 *         description: Staff salary not found
 */
staffSalaryRouter.get("/:id", authenticateToken, asyncHandler(staffSalaryController.getById));

/**
 * @swagger
 * /staff-salaries:
 *   post:
 *     summary: Create a staff salary record
 *     tags: [StaffSalary]
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
 *             required: [staffId, storeId, month, year, baseSalary, netPayable]
 *             properties:
 *               staffId:
 *                 type: integer
 *               storeId:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the store this salary record belongs to
 *               month:
 *                 type: integer
 *               year:
 *                 type: integer
 *               baseSalary:
 *                 type: number
 *               attendanceBonus:
 *                 type: number
 *               deductions:
 *                 type: number
 *               advanceDeduction:
 *                 type: number
 *               netPayable:
 *                 type: number
 *               paidAmount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [PENDING, PARTIAL, PAID, OVERDUE, CANCELLED]
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff salary created successfully
 */
staffSalaryRouter.post("/", authenticateToken, validate(createStaffSalarySchema), asyncHandler(staffSalaryController.create));

/**
 * @swagger
 * /staff-salaries/{id}:
 *   put:
 *     summary: Update a staff salary record
 *     tags: [StaffSalary]
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
 *               baseSalary:
 *                 type: number
 *               attendanceBonus:
 *                 type: number
 *               deductions:
 *                 type: number
 *               advanceDeduction:
 *                 type: number
 *               netPayable:
 *                 type: number
 *               paidAmount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [PENDING, PARTIAL, PAID, OVERDUE, CANCELLED]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff salary updated successfully
 */
staffSalaryRouter.put("/:id", authenticateToken, validate(updateStaffSalarySchema), asyncHandler(staffSalaryController.update));

/**
 * @swagger
 * /staff-salaries/{id}:
 *   delete:
 *     summary: Delete a staff salary record
 *     tags: [StaffSalary]
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
 *         description: Staff salary deleted successfully
 */
staffSalaryRouter.delete("/:id", authenticateToken, asyncHandler(staffSalaryController.delete));

export default staffSalaryRouter;
