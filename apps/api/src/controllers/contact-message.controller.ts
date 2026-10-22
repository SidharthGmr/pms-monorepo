import { ContactMessageDto, ContactMessageFilterParams, CreateContactMessageModel, CustomResponse, ListResponseDto, UpdateContactMessageStatusModel } from '@pms/types';
import { ContactMessageStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';
import { signFormSubmissionToken } from '../utils/page-access.util';

export class ContactMessageController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  // Storefront submission: no token, so the store (when given at all) comes from the query.
  createPublic = async (req: Request, res: Response): Promise<Response<CustomResponse<ContactMessageDto>>> => {
    const body = req.body as CreateContactMessageModel;
    const storeCode = (req.query['storeCode'] as string | undefined) || undefined;

    const data = await this.unitOfService.ContactMessage.create(body, storeCode);
    // The token unlocks CMS pages conditioned on this form (see page-access.util.ts).
    return res
      .status(201)
      .json({ success: true, message: 'Thanks - your message has been sent', data: { ...data, formToken: signFormSubmissionToken('contact') } });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<ContactMessageDto>>>> => {
    const filters: ContactMessageFilterParams = Object.fromEntries(
      Object.entries({
        status: req.query['status'] as ContactMessageStatus | undefined,
        search: req.query['search'] as string | undefined,
        storeCode: req.user?.storeCode || undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string, 10) : undefined,
        showAllRecords: req.query['showAllRecords'] === 'true' ? true : undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: req.query['sortDirection'] as string | undefined,
      }).filter(([, v]) => v !== undefined)
    );

    const data = await this.unitOfService.ContactMessage.getAll(filters);
    return res.status(200).json({ success: true, message: 'Contact messages fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<ContactMessageDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.ContactMessage.getById(id);
    return res.status(200).json({ success: true, message: 'Contact message fetched successfully', data });
  };

  updateStatus = async (req: Request, res: Response): Promise<Response<CustomResponse<ContactMessageDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const { status } = req.body as UpdateContactMessageStatusModel;
    const data = await this.unitOfService.ContactMessage.updateStatus(id, status as ContactMessageStatus);
    return res.status(200).json({ success: true, message: 'Contact message status updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<ContactMessageDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.ContactMessage.delete(id);
    return res.status(200).json({ success: true, message: 'Contact message deleted successfully', data });
  };
}
