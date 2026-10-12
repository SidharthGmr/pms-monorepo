import { CreateSubscriberModel, SubscriberDto, SubscriberFilterParams } from "@pms/types";
import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import CustomResponse from "../dtos/custom-response";
import { ListResponseDto } from "../dtos/list-response.dto";
import IUnitOfService from "../services/interfaces/iunitof.service";

export class SubscriberController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  // Storefront signup: no token, so the store (when given at all) comes from the query.
  subscribePublic = async (req: Request, res: Response): Promise<Response<CustomResponse<SubscriberDto>>> => {
    const body = req.body as CreateSubscriberModel;
    const storeCode = (req.query["storeCode"] as string | undefined) || undefined;

    const { subscriber, already } = await this.unitOfService.Subscriber.subscribe(body.email, storeCode);
    if (already) {
      return res.status(200).json({ success: true, message: "You are already subscribed", data: subscriber });
    }
    return res.status(201).json({ success: true, message: "Subscribed - welcome aboard", data: subscriber });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<SubscriberDto>>>> => {
    const filters: SubscriberFilterParams = Object.fromEntries(
      Object.entries({
        search: req.query["search"] as string | undefined,
        active: req.query["active"] !== undefined ? req.query["active"] === "true" : undefined,
        page: req.query["page"] ? parseInt(req.query["page"] as string, 10) : undefined,
        recordPerPage: req.query["recordPerPage"] ? parseInt(req.query["recordPerPage"] as string, 10) : undefined,
        showAllRecords: req.query["showAllRecords"] === "true" ? true : undefined,
        sortBy: req.query["sortBy"] as string | undefined,
        sortDirection: req.query["sortDirection"] as string | undefined,
      }).filter(([, v]) => v !== undefined)
    );

    const data = await this.unitOfService.Subscriber.getAll(filters);
    return res.status(200).json({ success: true, message: "Subscribers fetched successfully", data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<SubscriberDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    const data = await this.unitOfService.Subscriber.delete(id);
    return res.status(200).json({ success: true, message: "Subscriber deleted successfully", data });
  };
}
