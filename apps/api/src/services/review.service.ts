import { OrderStatus, Role, Status } from "@prisma/client";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { ListResponseDto } from "../dtos/list-response.dto";
import { CreateReviewDto, ReviewDto, ReviewSummaryDto, UpdateReviewDto } from "../dtos/review.dto";
import ForbiddenError from "../exceptions/forbidden-error";
import NotFoundError from "../exceptions/not-found-error";
import { ReviewFilterParams } from "../params/review.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { IReviewService, ReviewActor } from "./interfaces/Ireview.service";

const STAFF_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

@injectable()
export class ReviewService implements IReviewService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  private isStaff(actor: ReviewActor): boolean {
    return STAFF_ROLES.includes(actor.role);
  }

  async getAll(filters?: ReviewFilterParams): Promise<ListResponseDto<ReviewDto>> {
    return this.unitOfWork.Review.findAll(filters);
  }

  async getById(id: number): Promise<ReviewDto | null> {
    const review = await this.unitOfWork.Review.findById(id);
    if (!review) throw new NotFoundError("Review not found");
    return review;
  }

  async getSummary(productId: number): Promise<ReviewSummaryDto> {
    return this.unitOfWork.Review.getSummary(productId);
  }

  async create(data: CreateReviewDto, actor: ReviewActor, storeCode: string): Promise<ReviewDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      // Only purchased items may be reviewed: the order has to belong to the
      // caller and actually contain the product. The unique constraint on
      // (orderId, productId, userId) stops a second review for the same line.
      const order = await transactionClient.order.findFirst({
        where: {
          id: data.orderId,
          customerId: actor.userId,
          storeCode,
          items: { some: { productId: data.productId } },
        },
        select: { id: true, status: true },
      });

      if (!order) {
        throw new ForbiddenError("You can only review a product from your own order");
      }

      const review = await transactionClient.review.create({
        data: {
          orderId: data.orderId,
          productId: data.productId,
          userId: actor.userId,
          rating: data.rating,
          title: data.title || null,
          comment: data.comment || null,
          images: data.images ?? [],
          // The badge should mean the goods actually arrived, not merely that an
          // order row exists.
          isVerified: order.status === OrderStatus.DELIVERED,
        },
        select: { id: true },
      });

      const created = await this.unitOfWork.Review.findById(review.id);
      if (!created) throw new NotFoundError("Review not found");
      return created;
    });
  }

  async update(id: number, data: UpdateReviewDto, actor: ReviewActor): Promise<ReviewDto> {
    const existing = await this.unitOfWork.Review.findById(id);
    if (!existing) throw new NotFoundError("Review not found");

    const isStaff = this.isStaff(actor);
    if (!isStaff && existing.userId !== actor.userId) {
      throw new ForbiddenError("You can only edit your own review");
    }

    // Moderation is a staff action; a customer editing their own text must not be
    // able to publish a review an admin has moved to Draft or Trash.
    if (data.status !== undefined && !isStaff) {
      throw new ForbiddenError("Only staff can change a review's status");
    }

    return this.unitOfWork.transaction(async (transactionClient) => {
      await transactionClient.review.update({
        where: { id },
        data: {
          ...(data.rating !== undefined && { rating: data.rating }),
          ...(data.title !== undefined && { title: data.title || null }),
          ...(data.comment !== undefined && { comment: data.comment || null }),
          ...(data.images !== undefined && { images: data.images }),
          ...(data.status !== undefined && { status: data.status }),
        },
      });

      const updated = await this.unitOfWork.Review.findById(id);
      if (!updated) throw new NotFoundError("Review not found");
      return updated;
    });
  }

  async delete(id: number, actor: ReviewActor): Promise<ReviewDto> {
    const existing = await this.unitOfWork.Review.findById(id);
    if (!existing) throw new NotFoundError("Review not found");

    if (!this.isStaff(actor) && existing.userId !== actor.userId) {
      throw new ForbiddenError("You can only delete your own review");
    }

    if (existing.status === Status.Trash) return existing;
    return this.unitOfWork.Review.delete(id);
  }
}
