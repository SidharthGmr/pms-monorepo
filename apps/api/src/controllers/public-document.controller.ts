import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { CustomResponse, PublicDocumentDto } from '@pms/types';
import IUnitOfService from '../services/interfaces/iunitof.service';

/**
 * Serves documents behind a share link. These are the only unauthenticated read routes in
 * the app: the random token *is* the credential, so nothing here may accept an id, a number
 * or a filter - only the token, and only the trimmed public shape.
 */
export class PublicDocumentController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  getEstimate = async (req: Request, res: Response): Promise<Response<CustomResponse<PublicDocumentDto>>> => {
    const token = (req.params['token'] as string)?.trim();
    if (!token) return res.status(404).json({ success: false, message: 'Document not found' });
    const data = await this.unitOfService.Estimate.getPublic(token);
    return res.status(200).json({ success: true, message: 'Document fetched successfully', data });
  };

  getOrder = async (req: Request, res: Response): Promise<Response<CustomResponse<PublicDocumentDto>>> => {
    const token = (req.params['token'] as string)?.trim();
    if (!token) return res.status(404).json({ success: false, message: 'Document not found' });
    const data = await this.unitOfService.Order.getPublic(token);
    return res.status(200).json({ success: true, message: 'Document fetched successfully', data });
  };
}
