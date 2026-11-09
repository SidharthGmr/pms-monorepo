import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import IUnitOfService from "../services/interfaces/iunitof.service";
import { MISSING_STORE_CODE, MISSING_USER_ID } from '../constants/responses';

import {
  CreatePaymentDto,
  CustomResponse,
  ListResponseDto,
  OutstandingSummaryDto,
  PaymentDto,
  PaymentFilterParams,
  PaymentTransferModel,
  PaymentVoucherDto,
  PaymentVoucherModel,
  ReversePaymentModel,
  UpdatePaymentDto,
} from '@pms/types';
export class PaymentController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) {}

  getByOrderId = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<PaymentDto>>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const orderId = parseInt(req.params["orderId"] as string);
    if (isNaN(orderId)) return res.status(400).json({ success: false, message: "Invalid orderId" });
    const payments = await this.unitOfService.Payment.getByOrderId(orderId, storeCode);
    return res.status(200).json({ success: true, message: "Payments fetched successfully", data: { totalRecord: payments.length, data: payments } });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<PaymentDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const payment = await this.unitOfService.Payment.getById(id, storeCode);
    return res.status(200).json({ success: true, message: "Payment fetched successfully", data: payment });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<PaymentDto>>> => {
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const body = req.body as CreatePaymentDto;
    const payment = await this.unitOfService.Payment.create(body, storeCode, userId);
    return res.status(201).json({ success: true, message: "Payment created successfully", data: payment });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<PaymentDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const body = req.body as UpdatePaymentDto;
    const payment = await this.unitOfService.Payment.update(id, body, storeCode, userId);
    return res.status(200).json({ success: true, message: "Payment updated successfully", data: payment });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<PaymentDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const payment = await this.unitOfService.Payment.delete(id, storeCode);
    return res.status(200).json({ success: true, message: "Payment deleted successfully", data: payment });
  };

  createVoucher = async (req: Request, res: Response): Promise<Response<CustomResponse<PaymentVoucherDto>>> => {
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.Payment.createVoucher(req.body as PaymentVoucherModel, storeCode, userId);
    return res.status(201).json({ success: true, message: 'Payment recorded successfully', data });
  };

  transfer = async (req: Request, res: Response): Promise<Response<CustomResponse<PaymentVoucherDto>>> => {
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.Payment.transfer(req.body as PaymentTransferModel, storeCode, userId);
    return res.status(201).json({ success: true, message: 'Transfer recorded successfully', data });
  };

  getAllVouchers = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<PaymentVoucherDto>>>> => {
    const rawSortDirection = (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined;

    const filters: PaymentFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        direction: req.query['direction'] as string | undefined,
        method: req.query['method'] as string | undefined,
        paymentStatus: req.query['paymentStatus'] as string | undefined,
        partyType: req.query['partyType'] as string | undefined,
        partyId: req.query['partyId'] as string | undefined,
        ledgerAccountId: req.query['ledgerAccountId'] ? parseInt(req.query['ledgerAccountId'] as string) : undefined,
        orderId: req.query['orderId'] ? parseInt(req.query['orderId'] as string) : undefined,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: rawSortDirection,
      }).filter(([, value]) => value !== undefined)
    );

    const data = await this.unitOfService.Payment.getAllVouchers(filters);
    return res.status(200).json({ success: true, message: 'Payments fetched successfully', data });
  };

  getVoucherById = async (req: Request, res: Response): Promise<Response<CustomResponse<PaymentVoucherDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.Payment.getVoucherById(id, storeCode);
    return res.status(200).json({ success: true, message: 'Payment fetched successfully', data });
  };

  reverseVoucher = async (req: Request, res: Response): Promise<Response<CustomResponse<PaymentVoucherDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.Payment.reverseVoucher(id, req.body as ReversePaymentModel, storeCode, userId);
    return res.status(201).json({ success: true, message: 'Payment reversed successfully', data });
  };

  getOutstanding = async (req: Request, res: Response): Promise<Response<CustomResponse<OutstandingSummaryDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.Payment.getOutstanding(storeCode);
    return res.status(200).json({ success: true, message: 'Outstanding balances fetched successfully', data });
  };
}
