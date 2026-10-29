import { updateSettingsValidator } from "@pms/types";
import { Role } from "@prisma/client";
import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { SettingController } from "../controllers/setting.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import authorization from "../middleware/authorization.middleware";
import { validate } from "../middleware/validate";

const settingRouter = Router();
const settingController = container.get<SettingController>(TYPES.SettingController);

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

/**
 * @swagger
 * tags:
 *   - name: Setting
 *     description: Site Settings
 */

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get site settings (stored values merged with defaults)
 *     tags: [Setting]
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
 *         description: Settings fetched successfully
 *       401:
 *         description: Unauthorized
 */
settingRouter.get("/", authenticateToken, asyncHandler(settingController.get));

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Save one or more site settings
 *     tags: [Setting]
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
 *               logoUrl:
 *                 type: string
 *               siteName:
 *                 type: string
 *               supportEmail:
 *                 type: string
 *               invoiceTemplate:
 *                 type: string
 *                 enum: [classic, modern, minimal, receipt]
 *     responses:
 *       200:
 *         description: Settings saved successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
settingRouter.put("/", authenticateToken, authorization(ADMIN_ROLES), validate(updateSettingsValidator), asyncHandler(settingController.update));

export default settingRouter;
