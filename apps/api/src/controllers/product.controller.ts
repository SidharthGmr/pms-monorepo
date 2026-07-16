import { Status } from "@prisma/client";
import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { ListResponseDto, ProductModel, ProductResponseDto } from "@pms/types";
import { Role } from "../enum/user.enum";
import NotFoundError from "../exceptions/not-found-error";
import { ProductFilterParams } from "../params/product.params";
import IUnitOfService from "../services/interfaces/iunitof.service";
import CustomResponse from "@pms/types/src/dto/custom-response";

export class ProductController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) { }

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<ProductResponseDto>>> => {
    const userId = req.user?.userId as string;
    const storeCode = req.user?.storeCode;

    if (!storeCode || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.'
      });
    }
    const body = req.body as ProductModel;
    const product = await this.unitOfService.Product.create(body, userId, storeCode);
    return res.status(201).json({ success: true, message: "Product created successfully", data: product });
  };

  getAll = async (
    req: Request,
    res: Response
  ): Promise<Response<ListResponseDto<ProductResponseDto>>> => {
    const isAdmin = req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.ADMIN || req.user?.role === Role.USER || req.user?.role === Role.STAFF;
    const createdById = isAdmin ? undefined : req.user?.userId;
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }
    const filters: ProductFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        categoryId: req.query['categoryId'] ? parseInt(req.query['categoryId'] as string) : undefined,
        storeId: req.query['storeId'] ? parseInt(req.query['storeId'] as string) : undefined,
        status: req.query['status'] ? req.query['status'] as Status : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        createdById,
        storeCode,
      }).filter(([, v]) => v !== undefined)
    );
    const result = await this.unitOfService.Product.getAll(filters);
    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: { totalRecord: result.totalRecord, data: result.data },
    });
  };

  getById = async (
    req: Request,
    res: Response
  ): Promise<Response<CustomResponse<ProductResponseDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const product = await this.unitOfService.Product.getById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN' || req.user?.role === 'STAFF';
    if (!isAdmin && product.createdById !== req.user?.userId) {
      return res.status(403).json({ success: false, message: "Not enough permissions to access this product" });
    }
    if (req.user?.storeCode && product.storeCode !== req.user.storeCode) {
      return res.status(403).json({ success: false, message: "Not enough permissions to access this product" });
    }
    return res.status(200).json({ success: true, message: "Product fetched successfully", data: product });
  };

  update = async (
    req: Request,
    res: Response
  ): Promise<Response<CustomResponse<ProductResponseDto>>> => {
    const id = parseInt(req.params["id"] as string);
    const userId = req.user?.userId as string;
    const storeCode = req.user?.storeCode; // Get from logged-in user
    if (!id) throw new NotFoundError("Product id is required");
    if (!storeCode) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.'
      });
    }

    const existingProduct = await this.unitOfService.Product.getById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';
    if (!isAdmin && existingProduct.createdById !== userId) {
      return res.status(403).json({ success: false, message: "Not enough permissions to update this product" });
    }
    if (req.user?.storeCode && existingProduct.storeCode !== req.user.storeCode) {
      return res.status(403).json({ success: false, message: "Not enough permissions to update this product" });
    }

    const body = req.body as ProductModel;
    const product = await this.unitOfService.Product.update(id, body, userId, storeCode);
    return res.status(200).json({ success: true, message: "Product updated successfully", data: product });
  };


  delete = async (
    req: Request,
    res: Response
  ): Promise<Response<CustomResponse<ProductResponseDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    const existingProduct = await this.unitOfService.Product.getById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';
    if (!isAdmin && existingProduct.createdById !== req.user?.userId) {
      return res.status(403).json({ success: false, message: "Not enough permissions to delete this product" });
    }
    if (req.user?.storeCode && existingProduct.storeCode !== req.user.storeCode) {
      return res.status(403).json({ success: false, message: "Not enough permissions to delete this product" });
    }

    const product = await this.unitOfService.Product.delete(id);
    return res.status(204).json({ success: true, message: "Product deleted successfully", data: product });
  };
}
