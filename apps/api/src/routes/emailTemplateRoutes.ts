import { previewEmailTemplateValidator, updateEmailTemplateValidator } from "@pms/types";
import { Role } from "@prisma/client";
import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { EmailTemplateController } from "../controllers/email-template.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import authorization from "../middleware/authorization.middleware";
import { validate } from "../middleware/validate";

const emailTemplateRouter = Router();
const emailTemplateController = container.get<EmailTemplateController>(TYPES.EmailTemplateController);

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

/**
 * @swagger
 * tags:
 *   - name: EmailTemplate
 *     description: Transactional Email Templates
 */

/**
 * @swagger
 * /email-templates:
 *   get:
 *     summary: Get all email templates (defaults merged with saved overrides)
 *     tags: [EmailTemplate]
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
 *         description: Email templates fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
emailTemplateRouter.get("/", authenticateToken, authorization(ADMIN_ROLES), asyncHandler(emailTemplateController.getAll));

/**
 * @swagger
 * /email-templates/{key}:
 *   get:
 *     summary: Get one email template by key
 *     tags: [EmailTemplate]
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
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email template fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Email template not found
 */
emailTemplateRouter.get("/:key", authenticateToken, authorization(ADMIN_ROLES), asyncHandler(emailTemplateController.getByKey));

/**
 * @swagger
 * /email-templates/{key}:
 *   put:
 *     summary: Save a customised subject and body for an email template
 *     tags: [EmailTemplate]
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
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, html]
 *             properties:
 *               subject:
 *                 type: string
 *               html:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email template saved successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Email template not found
 */
emailTemplateRouter.put("/:key", authenticateToken, authorization(ADMIN_ROLES), validate(updateEmailTemplateValidator), asyncHandler(emailTemplateController.update));

/**
 * @swagger
 * /email-templates/{key}:
 *   delete:
 *     summary: Reset an email template to its file default
 *     tags: [EmailTemplate]
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
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email template reset to default
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Email template not found
 */
emailTemplateRouter.delete("/:key", authenticateToken, authorization(ADMIN_ROLES), asyncHandler(emailTemplateController.reset));

/**
 * @swagger
 * /email-templates/{key}/preview:
 *   post:
 *     summary: Render a template body with sample data for preview
 *     tags: [EmailTemplate]
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
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, html]
 *             properties:
 *               subject:
 *                 type: string
 *               html:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email template preview rendered
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Email template not found
 */
emailTemplateRouter.post(
  "/:key/preview",
  authenticateToken,
  authorization(ADMIN_ROLES),
  validate(previewEmailTemplateValidator),
  asyncHandler(emailTemplateController.preview)
);

/**
 * @swagger
 * /email-templates/{key}/test:
 *   post:
 *     summary: Send a test email with sample data to the signed-in admin
 *     tags: [EmailTemplate]
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
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, html]
 *             properties:
 *               subject:
 *                 type: string
 *               html:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test email sent
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Email template not found
 *       502:
 *         description: The test email could not be sent
 */
emailTemplateRouter.post(
  "/:key/test",
  authenticateToken,
  authorization(ADMIN_ROLES),
  validate(previewEmailTemplateValidator),
  asyncHandler(emailTemplateController.sendTest)
);

export default emailTemplateRouter;
