import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import IUnitOfService from "../services/interfaces/iunitof.service";
import CustomResponse from "../dtos/custom-response";
import { CreatePaymentDto, PaymentDto, UpdatePaymentDto } from "../dtos/payment.dto";
import { ListResponseDto } from "../dtos/list-response.dto";

export class PaymentController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) {}

  getByOrderId = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<PaymentDto>>>> => {
    const orderId = parseInt(req.params["orderId"] as string);
    if (isNaN(orderId)) return res.status(400).json({ success: false, message: "Invalid orderId" });
    const payments = await this.unitOfService.Payment.getByOrderId(orderId);
    return res.status(200).json({ success: true, message: "Payments fetched successfully", data: { totalRecord: payments.length, data: payments } });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<PaymentDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const payment = await this.unitOfService.Payment.getById(id);
    return res.status(200).json({ success: true, message: "Payment fetched successfully", data: payment });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<PaymentDto>>> => {
    const body = req.body as CreatePaymentDto;
    const payment = await this.unitOfService.Payment.create(body);
    return res.status(201).json({ success: true, message: "Payment created successfully", data: payment });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<PaymentDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const body = req.body as UpdatePaymentDto;
    const payment = await this.unitOfService.Payment.update(id, body);
    return res.status(200).json({ success: true, message: "Payment updated successfully", data: payment });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<PaymentDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const payment = await this.unitOfService.Payment.delete(id);
    return res.status(200).json({ success: true, message: "Payment deleted successfully", data: payment });
  };
}
