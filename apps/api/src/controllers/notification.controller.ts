import { MarkNotificationsReadModel, NotificationDto, NotificationFilterParams, NotificationSummaryDto, NotificationType, MarkNotificationsReadResultDto } from "@pms/types";
import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import CustomResponse from "../dtos/custom-response";
import { ListResponseDto } from "../dtos/list-response.dto";
import IUnitOfService from "../services/interfaces/iunitof.service";

const MISSING_USER = "Your session is missing a user. Please sign in again.";

/**
 * Every route here reads `req.user.userId` for the recipient, never a parameter: a caller can
 * only ever see, mark or delete their own notifications, whatever they put in the request.
 */
export class NotificationController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<NotificationDto>>>> => {
    const recipientId = req.user?.userId;
    if (!recipientId) return res.status(400).json({ success: false, message: MISSING_USER });

    const isReadParam = req.query["isRead"] as string | undefined;
    const filters: NotificationFilterParams = Object.fromEntries(
      Object.entries({
        type: req.query["type"] as NotificationType | undefined,
        isRead: isReadParam === "true" ? true : isReadParam === "false" ? false : undefined,
        search: req.query["search"] as string | undefined,
        startDate: req.query["startDate"] ? new Date(req.query["startDate"] as string) : undefined,
        endDate: req.query["endDate"] ? new Date(req.query["endDate"] as string) : undefined,
        page: req.query["page"] ? parseInt(req.query["page"] as string, 10) : undefined,
        recordPerPage: req.query["recordPerPage"] ? parseInt(req.query["recordPerPage"] as string, 10) : undefined,
        showAllRecords: req.query["showAllRecords"] === "true" ? true : undefined,
        sortBy: req.query["sortBy"] as string | undefined,
        sortDirection: req.query["sortDirection"] as string | undefined,
      }).filter(([, v]) => v !== undefined)
    );

    const data = await this.unitOfService.Notification.getAll(recipientId, filters);
    return res.status(200).json({ success: true, message: "Notifications fetched successfully", data });
  };

  getUnreadCount = async (req: Request, res: Response): Promise<Response<CustomResponse<NotificationSummaryDto>>> => {
    const recipientId = req.user?.userId;
    if (!recipientId) return res.status(400).json({ success: false, message: MISSING_USER });

    const unreadCount = await this.unitOfService.Notification.getUnreadCount(recipientId);
    return res.status(200).json({ success: true, message: "Unread count fetched successfully", data: { unreadCount } });
  };

  markRead = async (req: Request, res: Response): Promise<Response<CustomResponse<MarkNotificationsReadResultDto>>> => {
    const recipientId = req.user?.userId;
    if (!recipientId) return res.status(400).json({ success: false, message: MISSING_USER });

    const { ids } = (req.body ?? {}) as MarkNotificationsReadModel;
    const updated = await this.unitOfService.Notification.markRead(recipientId, ids);
    return res.status(200).json({ success: true, message: "Notifications marked as read", data: { updated } });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<NotificationDto>>> => {
    const recipientId = req.user?.userId;
    if (!recipientId) return res.status(400).json({ success: false, message: MISSING_USER });

    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    const data = await this.unitOfService.Notification.delete(id, recipientId);
    return res.status(200).json({ success: true, message: "Notification deleted successfully", data });
  };
}
