import { Router } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { CatalogController } from "../controllers/catalog.controller";
import asyncHandler from "../middleware/asyncHandler.middleware";

const catalogRouter = Router();
const catalogController = container.get<CatalogController>(TYPES.CatalogController);

/**
 * @swagger
 * tags:
 *   - name: Catalog
 *     description: Public storefront catalog - published products with their variants, filtered at variant level
 */

/**
 * @swagger
 * /catalog/products:
 *   get:
 *     summary: List published products with their variants (public)
 *     description: Only Published, non-deleted products with at least one Published active variant are returned. entryIds are MasterEntry ids - values of one attribute OR together, different attributes AND together.
 *     tags: [Catalog]
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: storeCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryIds
 *         schema:
 *           type: string
 *           example: 1,2
 *       - in: query
 *         name: brandNameIds
 *         schema:
 *           type: string
 *           example: 3,4
 *       - in: query
 *         name: entryIds
 *         schema:
 *           type: string
 *           example: 17,18,14
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *       - in: query
 *         name: inStockOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: offersOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: featuredOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, name, newest, rating]
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: recordPerPage
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Catalog fetched successfully
 */
catalogRouter.get("/products", asyncHandler(catalogController.getAll));

/**
 * @swagger
 * /catalog/facets:
 *   get:
 *     summary: Filter options for the catalog sidebar (public)
 *     description: Categories, brands and attribute values with counts, plus the payable-price range, computed from the published catalog.
 *     tags: [Catalog]
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema:
 *           type: string
 *         required: true
 *         description: Enter Client Id
 *       - in: query
 *         name: storeCode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Catalog facets fetched successfully
 */
catalogRouter.get("/facets", asyncHandler(catalogController.getFacets));

/**
 * @swagger
 * /catalog/products/{slug}:
 *   get:
 *     summary: One published product with all its variants (public)
 *     tags: [Catalog]
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
 *       - in: query
 *         name: storeCode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *       400:
 *         description: Invalid product
 *       404:
 *         description: Product not found
 */
catalogRouter.get("/products/:slug", asyncHandler(catalogController.getBySlug));

export default catalogRouter;
