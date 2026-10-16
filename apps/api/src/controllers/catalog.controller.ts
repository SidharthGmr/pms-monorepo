import { CatalogFacetsDto, CatalogFilterParams, CatalogProductDto, CustomResponse, ListResponseDto } from "@pms/types";
import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import IUnitOfService from "../services/interfaces/iunitof.service";

const idList = (value: unknown): number[] | undefined => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const ids = value
    .split(",")
    .map((part) => parseInt(part.trim(), 10))
    .filter((id) => Number.isInteger(id) && id > 0);
  return ids.length ? ids : undefined;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export class CatalogController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<CatalogProductDto>>>> => {
    const filters: CatalogFilterParams = Object.fromEntries(
      Object.entries({
        search: (req.query["search"] as string | undefined)?.trim() || undefined,
        storeCode: (req.query["storeCode"] as string | undefined) || undefined,
        categoryIds: idList(req.query["categoryIds"]),
        brandNameIds: idList(req.query["brandNameIds"]),
        entryIds: idList(req.query["entryIds"]),
        minPrice: toNumber(req.query["minPrice"]),
        maxPrice: toNumber(req.query["maxPrice"]),
        minRating: toNumber(req.query["minRating"]),
        inStockOnly: req.query["inStockOnly"] === "true" ? true : undefined,
        offersOnly: req.query["offersOnly"] === "true" ? true : undefined,
        featuredOnly: req.query["featuredOnly"] === "true" ? true : undefined,
        sortBy: (req.query["sortBy"] as string | undefined) || undefined,
        sortDirection: req.query["sortDirection"] === "asc" ? "asc" : req.query["sortDirection"] === "desc" ? "desc" : undefined,
        page: req.query["page"] ? parseInt(req.query["page"] as string, 10) : undefined,
        recordPerPage: req.query["recordPerPage"] ? parseInt(req.query["recordPerPage"] as string, 10) : undefined,
      }).filter(([, value]) => value !== undefined)
    );

    const data = await this.unitOfService.Catalog.getAll(filters);
    return res.status(200).json({ success: true, message: "Catalog fetched successfully", data });
  };

  getBySlug = async (req: Request, res: Response): Promise<Response<CustomResponse<CatalogProductDto>>> => {
    const slug = String(req.params["slug"] ?? "").trim();
    if (!slug) return res.status(400).json({ success: false, message: "Invalid product" });

    const storeCode = (req.query["storeCode"] as string | undefined) || undefined;
    const data = await this.unitOfService.Catalog.getBySlug(slug, storeCode);
    return res.status(200).json({ success: true, message: "Product fetched successfully", data });
  };

  getFacets = async (req: Request, res: Response): Promise<Response<CustomResponse<CatalogFacetsDto>>> => {
    const storeCode = (req.query["storeCode"] as string | undefined) || undefined;
    const data = await this.unitOfService.Catalog.getFacets(storeCode);
    return res.status(200).json({ success: true, message: "Catalog facets fetched successfully", data });
  };
}
