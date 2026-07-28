import { Role } from "@prisma/client";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { ListResponseDto } from "../dtos/list-response.dto";
import { CreateReviewReplyDto, ReviewReplyDto, UpdateReviewReplyDto } from "../dtos/review.dto";
import ForbiddenError from "../exceptions/forbidden-error";
import NotFoundError from "../exceptions/not-found-error";
import { ReviewReplyFilterParams } from "../params/review.params";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import { IReviewReplyService } from "./interfaces/Ireview-reply.service";
import { ReviewActor } from "./interfaces/Ireview.service";

// A reply is the shop's answer to a customer, so only staff write them. The
// routes enforce this too; this keeps the rule true if the service is reused.
const STAFF_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];

@injectable()
export class ReviewReplyService implements IReviewReplyService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) { }

  private isStaff(actor: ReviewActor): boolean {
    return STAFF_ROLES.includes(actor.role);
  }

  async getAll(filters?: ReviewReplyFilterParams): Promise<ListResponseDto<ReviewReplyDto>> {
    return this.unitOfWork.ReviewReply.findAll(filters);
  }

  async getById(id: number): Promise<ReviewReplyDto | null> {
    const reply = await this.unitOfWork.ReviewReply.findById(id);
    if (!reply) throw new NotFoundError("Review reply not found");
    return reply;
  }

  async create(data: CreateReviewReplyDto, actor: ReviewActor): Promise<ReviewReplyDto> {
    if (!this.isStaff(actor)) {
      throw new ForbiddenError("Only staff can reply to a review");
    }

    const review = await this.unitOfWork.Review.findById(data.reviewId);
    if (!review) throw new NotFoundError("Review not found");

    return this.unitOfWork.transaction(async (transactionClient) => {
      const reply = await transactionClient.reviewReply.create({
        data: {
          reviewId: data.reviewId,
          userId: actor.userId,
          comment: data.comment,
        },
        select: { id: true },
      });

      // Read back through the transaction client - the global one cannot see this row yet.
      const created = await this.unitOfWork.ReviewReply.findById(reply.id, transactionClient);
      if (!created) throw new NotFoundError("Review reply not found");
      return created;
    });
  }

  async update(id: number, data: UpdateReviewReplyDto, actor: ReviewActor): Promise<ReviewReplyDto> {
    const existing = await this.unitOfWork.ReviewReply.findById(id);
    if (!existing) throw new NotFoundError("Review reply not found");

    // Staff may fix their own wording; only an admin may rewrite someone else's.
    const isAdmin = actor.role === Role.SUPER_ADMIN || actor.role === Role.ADMIN;
    if (existing.userId !== actor.userId && !isAdmin) {
      throw new ForbiddenError("You can only edit your own reply");
    }

    return this.unitOfWork.transaction(async (transactionClient) => {
      await transactionClient.reviewReply.update({
        where: { id },
        data: { comment: data.comment },
      });

      const updated = await this.unitOfWork.ReviewReply.findById(id, transactionClient);
      if (!updated) throw new NotFoundError("Review reply not found");
      return updated;
    });
  }

  async delete(id: number, actor: ReviewActor): Promise<ReviewReplyDto> {
    const existing = await this.unitOfWork.ReviewReply.findById(id);
    if (!existing) throw new NotFoundError("Review reply not found");

    const isAdmin = actor.role === Role.SUPER_ADMIN || actor.role === Role.ADMIN;
    if (existing.userId !== actor.userId && !isAdmin) {
      throw new ForbiddenError("You can only delete your own reply");
    }

    return this.unitOfWork.ReviewReply.delete(id);
  }
}
