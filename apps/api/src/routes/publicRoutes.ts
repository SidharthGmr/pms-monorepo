import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { PublicDocumentController } from '../controllers/public-document.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';

const publicRouter = Router();
const publicDocumentController = container.get<PublicDocumentController>(TYPES.PublicDocumentController);

/**
 * @swagger
 * tags:
 *   - name: Public
 *     description: Unauthenticated read-only documents behind a share link
 */

/**
 * @swagger
 * /public/estimates/{token}:
 *   get:
 *     summary: Read a shared estimate
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document fetched successfully
 *       404:
 *         description: Document not found
 *     description: No authentication and no clientId header - the unguessable token is the credential. An unknown or revoked token is a 404, never a 401, so a probe learns nothing.
 */
publicRouter.get('/estimates/:token', asyncHandler(publicDocumentController.getEstimate));

/**
 * @swagger
 * /public/orders/{token}:
 *   get:
 *     summary: Read a shared order
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document fetched successfully
 *       404:
 *         description: Document not found
 *     description: No authentication and no clientId header - the unguessable token is the credential.
 */
publicRouter.get('/orders/:token', asyncHandler(publicDocumentController.getOrder));

export default publicRouter;
