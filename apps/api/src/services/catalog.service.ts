import { CatalogFacetsDto, CatalogFilterParams, CatalogProductDto, ListResponseDto } from "@pms/types";
import { inject, injectable } from "inversify";
import NotFoundError from "../exceptions/not-found-error";
import { TYPES } from "../config/ioc.types";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { ICatalogService } from "./interfaces/Icatalog.service";

@injectable()
export class CatalogService implements ICatalogService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  async getAll(filters?: CatalogFilterParams): Promise<ListResponseDto<CatalogProductDto>> {
    return this.unitOfWork.Catalog.findAll(filters);
  }

  async getBySlug(slug: string, storeCode?: string): Promise<CatalogProductDto> {
    const product = await this.unitOfWork.Catalog.findBySlug(slug, storeCode);
    if (!product) throw new NotFoundError("Product not found");
    return product;
  }

  async getFacets(storeCode?: string): Promise<CatalogFacetsDto> {
    return this.unitOfWork.Catalog.getFacets(storeCode);
  }
}
