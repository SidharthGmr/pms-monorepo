import { CmsPageValidator, UnlockCmsPageValidator } from "@pms/types";
import { Role } from "@prisma/client";
import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { CmsPageController } from "../controllers/cms-page.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";
import { authenticateToken } from "../middleware/authentication.middleware";
import authorization from "../middleware/authorization.middleware";
import { authLimiter } from "../middleware/rateLimiter.middleware";
import { validate } from "../middleware/validate";

const cmsPageRouter = Router();
const cmsPageController = container.get<CmsPageController>(TYPES.CmsPageController);

// Pages are site content, so only admins write them - unlike catalog data there is no STAFF access.
const PAGE_ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

/**
 * @swagger
 * tags:
 *   - name: CmsPage
 *     description: Dynamic website pages
 */

/**
 * @swagger
 * /cms-pages:
 *   post:
 *     summary: Create a page
 *     tags: [CmsPage]
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               urlOption:
 *                 type: string
 *                 enum: [default, custom]
 *               status:
 *                 type: string
 *                 enum: [Draft, Published, Unpublished, Archived]
 *               includeHeader:
 *                 type: boolean
 *               includeFooter:
 *                 type: boolean
 *               thumbnailUrl:
 *                 type: string
 *               passwordEnabled:
 *                 type: boolean
 *               password:
 *                 type: string
 *               removePassword:
 *                 type: boolean
 *               conditionEnabled:
 *                 type: boolean
 *               conditionForm:
 *                 type: string
 *                 enum: [contact, subscribe]
 *               htmlContent:
 *                 type: string
 *               cssContent:
 *                 type: string
 *               jsContent:
 *                 type: string
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               metaKeywords:
 *                 type: string
 *               canonicalUrl:
 *                 type: string
 *               robots:
 *                 type: string
 *               ogTitle:
 *                 type: string
 *               ogDescription:
 *                 type: string
 *               ogImageUrl:
 *                 type: string
 *               schemaMarkup:
 *                 type: array
 *                 items:
 *                   type: object
 *               headerScript:
 *                 type: string
 *               afterBodyScript:
 *                 type: string
 *               footerScript:
 *                 type: string
 *               preloadScript:
 *                 type: string
 *               hideFromSearch:
 *                 type: boolean
 *               disableRecaptcha:
 *                 type: boolean
 *               excludeFromSitemap:
 *                 type: boolean
 *               sitemapPriority:
 *                 type: number
 *     responses:
 *       201:
 *         description: Page created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enough permissions
 *       409:
 *         description: A page with this URL already exists
 */
cmsPageRouter.post("/", authenticateToken, authorization(PAGE_ADMIN_ROLES), validate(CmsPageValidator), asyncHandler(cmsPageController.create));

/**
 * @swagger
 * /cms-pages:
 *   get:
 *     summary: Get all pages
 *     tags: [CmsPage]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Published, Unpublished, Archived]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
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
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Pages fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enough permissions
 */
cmsPageRouter.get("/", authenticateToken, authorization(PAGE_ADMIN_ROLES), asyncHandler(cmsPageController.getAll));

/**
 * @swagger
 * /cms-pages/public/sitemap:
 *   get:
 *     summary: Sitemap entries for published, indexable pages (public)
 *     tags: [CmsPage]
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *     responses:
 *       200:
 *         description: Sitemap entries fetched successfully
 */
cmsPageRouter.get("/public/sitemap", asyncHandler(cmsPageController.getSitemapEntries));

/**
 * @swagger
 * /cms-pages/public/{slug}:
 *   get:
 *     summary: Get a published page by slug (public)
 *     tags: [CmsPage]
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *       - in: header
 *         name: x-page-access
 *         schema:
 *           type: string
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Page fetched successfully
 *       400:
 *         description: Invalid slug
 *       404:
 *         description: Page not found
 */
cmsPageRouter.get("/public/:slug", asyncHandler(cmsPageController.getPublicBySlug));

/**
 * @swagger
 * /cms-pages/public/{slug}/unlock:
 *   post:
 *     summary: Unlock a password-protected page (public)
 *     tags: [CmsPage]
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Page unlocked
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Incorrect page password
 *       404:
 *         description: Page not found
 *       429:
 *         description: Too many attempts. Please try again later.
 */
cmsPageRouter.post("/public/:slug/unlock", authLimiter, validate(UnlockCmsPageValidator), asyncHandler(cmsPageController.unlock));

/**
 * @swagger
 * /cms-pages/{id}:
 *   get:
 *     summary: Get a page by id
 *     tags: [CmsPage]
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
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Page fetched successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enough permissions
 *       404:
 *         description: Page not found
 */
cmsPageRouter.get("/:id", authenticateToken, authorization(PAGE_ADMIN_ROLES), asyncHandler(cmsPageController.getById));

/**
 * @swagger
 * /cms-pages/{id}:
 *   put:
 *     summary: Update a page
 *     tags: [CmsPage]
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
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               urlOption:
 *                 type: string
 *                 enum: [default, custom]
 *               status:
 *                 type: string
 *                 enum: [Draft, Published, Unpublished, Archived]
 *               includeHeader:
 *                 type: boolean
 *               includeFooter:
 *                 type: boolean
 *               thumbnailUrl:
 *                 type: string
 *               passwordEnabled:
 *                 type: boolean
 *               password:
 *                 type: string
 *               removePassword:
 *                 type: boolean
 *               conditionEnabled:
 *                 type: boolean
 *               conditionForm:
 *                 type: string
 *                 enum: [contact, subscribe]
 *               htmlContent:
 *                 type: string
 *               cssContent:
 *                 type: string
 *               jsContent:
 *                 type: string
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               metaKeywords:
 *                 type: string
 *               canonicalUrl:
 *                 type: string
 *               robots:
 *                 type: string
 *               ogTitle:
 *                 type: string
 *               ogDescription:
 *                 type: string
 *               ogImageUrl:
 *                 type: string
 *               schemaMarkup:
 *                 type: array
 *                 items:
 *                   type: object
 *               headerScript:
 *                 type: string
 *               afterBodyScript:
 *                 type: string
 *               footerScript:
 *                 type: string
 *               preloadScript:
 *                 type: string
 *               hideFromSearch:
 *                 type: boolean
 *               disableRecaptcha:
 *                 type: boolean
 *               excludeFromSitemap:
 *                 type: boolean
 *               sitemapPriority:
 *                 type: number
 *     responses:
 *       200:
 *         description: Page updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enough permissions
 *       404:
 *         description: Page not found
 *       409:
 *         description: A page with this URL already exists
 */
cmsPageRouter.put("/:id", authenticateToken, authorization(PAGE_ADMIN_ROLES), validate(CmsPageValidator), asyncHandler(cmsPageController.update));

/**
 * @swagger
 * /cms-pages/{id}:
 *   delete:
 *     summary: Delete a page
 *     tags: [CmsPage]
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
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Page deleted successfully
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enough permissions
 *       404:
 *         description: Page not found
 */
cmsPageRouter.delete("/:id", authenticateToken, authorization(PAGE_ADMIN_ROLES), asyncHandler(cmsPageController.delete));

export default cmsPageRouter;
