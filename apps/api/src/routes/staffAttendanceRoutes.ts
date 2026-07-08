import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { StaffAttendanceController } from "../controllers/staff-attendance.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validate";
import { createStaffAttendanceSchema, updateStaffAttendanceSchema } from "../schemas/staffAttendanceSchema";

const staffAttendanceRouter = Router();
const staffAttendanceController = container.get<StaffAttendanceController>(TYPES.StaffAttendanceController);

/**
 * @swagger
 * tags:
 *   - name: StaffAttendance
 *     description: Staff Attendance Management
 */

/**
 * @swagger
 * /staff-attendance:
 *   get:
 *     summary: Get all attendance records
 *     tags: [StaffAttendance]
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
 *         description: Staff attendance records fetched successfully
 */
staffAttendanceRouter.get("/", authenticateToken, asyncHandler(staffAttendanceController.getAll));

/**
 * @swagger
 * /staff-attendance/staff/{staffId}:
 *   get:
 *     summary: Get attendance records by staff ID
 *     tags: [StaffAttendance]
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
 *         description: Staff attendance records fetched successfully
 */
staffAttendanceRouter.get("/staff/:staffId", authenticateToken, asyncHandler(staffAttendanceController.getByStaffId));

/**
 * @swagger
 * /staff-attendance/{id}:
 *   get:
 *     summary: Get attendance record by ID
 *     tags: [StaffAttendance]
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
 *         description: Staff attendance record fetched successfully
 *       404:
 *         description: Record not found
 */
staffAttendanceRouter.get("/:id", authenticateToken, asyncHandler(staffAttendanceController.getById));

/**
 * @swagger
 * /staff-attendance:
 *   post:
 *     summary: Create an attendance record
 *     tags: [StaffAttendance]
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
 *             required: [staffId, storeId, date]
 *             properties:
 *               staffId:
 *                 type: integer
 *               storeId:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the store this attendance record belongs to
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE, LEAVE, HALF_DAY]
 *               checkInTime:
 *                 type: string
 *               checkOutTime:
 *                 type: string
 *               overtimeHours:
 *                 type: number
 *               remarks:
 *                 type: string
 *               recordedBy:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Staff attendance record created successfully
 */
staffAttendanceRouter.post("/", authenticateToken, validate(createStaffAttendanceSchema), asyncHandler(staffAttendanceController.create));

/**
 * @swagger
 * /staff-attendance/{id}:
 *   put:
 *     summary: Update an attendance record
 *     tags: [StaffAttendance]
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
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE, LEAVE, HALF_DAY]
 *               checkInTime:
 *                 type: string
 *               checkOutTime:
 *                 type: string
 *               overtimeHours:
 *                 type: number
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff attendance record updated successfully
 */
staffAttendanceRouter.put("/:id", authenticateToken, validate(updateStaffAttendanceSchema), asyncHandler(staffAttendanceController.update));

/**
 * @swagger
 * /staff-attendance/{id}:
 *   delete:
 *     summary: Delete an attendance record
 *     tags: [StaffAttendance]
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
 *         description: Staff attendance record deleted successfully
 */
staffAttendanceRouter.delete("/:id", authenticateToken, asyncHandler(staffAttendanceController.delete));

export default staffAttendanceRouter;
