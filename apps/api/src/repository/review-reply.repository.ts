import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ListResponseDto } from "../dtos/list-response.dto";
import { ReviewReplyDto } from "../dtos/review.dto";
import { ReviewReplyFilterParams } from "../params/review.params";
import { IReviewReplyRepository } from "./interfaces/ireview-reply.repository";

const replyInclude = {
    user: { select: { userId: true, name: true, email: true, profileImageUrl: true } },
};

type ReplyWithUser = Prisma.ReviewReplyGetPayload<{ include: typeof replyInclude }>;

const SORTABLE_COLUMNS = new Set(['createdAt', 'updatedAt']);

function toDto(reply: ReplyWithUser): ReviewReplyDto {
    return {
        id: reply.id,
        reviewId: reply.reviewId,
        userId: reply.userId,
        comment: reply.comment,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        user: reply.user,
    };
}

export class ReviewReplyRepository implements IReviewReplyRepository {
    async findAll(filters?: ReviewReplyFilterParams): Promise<ListResponseDto<ReviewReplyDto>> {
        let page = 1;
        let limit = 10;
        const where: Prisma.ReviewReplyWhereInput = {};

        if (filters) {
            page = filters.page ?? page;
            limit = filters.recordPerPage ?? limit;

            if (filters.reviewId !== undefined) where.reviewId = filters.reviewId;
            if (filters.userId !== undefined) where.userId = filters.userId;

            if (filters.search) {
                where.comment = { contains: filters.search, mode: 'insensitive' };
            }

            // A reply is scoped through its review's product.
            if (filters.storeCode !== undefined) {
                where.review = { product: { storeCode: filters.storeCode } };
            }

            if (filters.startDate != null || filters.endDate != null) {
                where.createdAt = {
                    ...(filters.startDate != null && { gte: filters.startDate }),
                    ...(filters.endDate != null && { lte: filters.endDate }),
                };
            }
        }

        // Replies read as a conversation, so oldest-first is the useful default.
        const column = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
        const direction: Prisma.SortOrder = filters?.sortOrder === 'desc' ? 'desc' : 'asc';

        const showAll = filters?.showAllRecords === true;
        const skip = showAll ? undefined : (page - 1) * limit;
        const take = showAll ? undefined : limit;

        const [data, total] = await Promise.all([
            prisma.reviewReply.findMany({
                where,
                include: replyInclude,
                orderBy: [{ [column]: direction }, { id: 'asc' }],
                ...(skip !== undefined && { skip }),
                ...(take !== undefined && { take }),
            }),
            prisma.reviewReply.count({ where }),
        ]);

        return { totalRecord: total, data: data.map(toDto) };
    }

    // `tx` matters when the caller is inside a transaction: a read on the global client
    // cannot see rows the open transaction has not committed yet.
    async findById(id: number, tx: Prisma.TransactionClient = prisma): Promise<ReviewReplyDto | null> {
        const reply = await tx.reviewReply.findUnique({ where: { id }, include: replyInclude });
        return reply ? toDto(reply) : null;
    }

    async delete(id: number): Promise<ReviewReplyDto> {
        const reply = await prisma.reviewReply.delete({ where: { id }, include: replyInclude });
        return toDto(reply);
    }
}
