import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { BrandNameDto, CreateBrandNameDto } from "../dtos/brand-name.dto";
import { ListResponseDto } from "../dtos/list-response.dto";
import NotFoundError from "../exceptions/not-found-error";
import { BrandNameFilterParams } from "../params/brand-name.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { IBrandNameService } from "./interfaces/Ibrand-name.service";

@injectable()
export class BrandNameService implements IBrandNameService {
  constructor(
    @inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork
  ) { }

  async getAll(filters?: BrandNameFilterParams): Promise<ListResponseDto<BrandNameDto>> {
    return this.unitOfWork.BrandName.findAll(filters);
  }

  async getById(id: number): Promise<BrandNameDto | null> {
    const brandName = await this.unitOfWork.BrandName.findById(id);
    if (!brandName) throw new NotFoundError("BrandName not found");
    return brandName;
  }

  async create(data: CreateBrandNameDto, storeCode: string): Promise<BrandNameDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const storeData = await transactionClient.brandName.create({
        data: {
          name: data.name,
          storeCode: storeCode,
          status: data.status,
          displayOrder: data.displayOrder || null,
        },
      });
      return storeData;
    });
  }

  async update(id: number, data: CreateBrandNameDto): Promise<BrandNameDto> {
    const existing = await this.unitOfWork.BrandName.findById(id);
    if (!existing) throw new NotFoundError("BrandName not found");


    return this.unitOfWork.transaction(async (transactionClient) => {

      const storeData = await transactionClient.brandName.update({
        where: { id },
        data: {
          name: data.name,
          storeCode: data.storeCode,
          status: data.status,
          displayOrder: data.displayOrder || null,
          updatedAt: new Date(),
        },
      });
      return storeData;
    });
  }

  async delete(id: number): Promise<BrandNameDto> {
    const existing = await this.unitOfWork.BrandName.findById(id);
    if (!existing) throw new NotFoundError("BrandName not found");
    return this.unitOfWork.BrandName.delete(id);
  }
}
