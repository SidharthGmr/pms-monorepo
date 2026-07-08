import { Router } from "express";
import { TYPES } from "../config/ioc.types";
import { HealthController } from "../controllers/health.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { container } from "../config/ioc.config";

const healthRouter = Router();

const healthController = container.get<HealthController>(
  TYPES.HealthController
);

/**
 * @swagger
 * tags:
 *   - name: HealthCheck
 *     description: Health Check Endpoints
 */

/**
 * @swagger
 * /health/check:
 *   get:
 *     summary: Health Check
 *     tags: [HealthCheck]
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
 *     responses:
 *       201: { description: Created }
 */

healthRouter.get("/check", asyncHandler(healthController.check));

export default healthRouter;
