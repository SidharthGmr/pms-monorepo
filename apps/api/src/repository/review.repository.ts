import { Prisma, Status } from "@prisma/client";
import prisma from "../config/prisma";
import { ListResponseDto } from "../dtos/list-response.dto";
import { ReviewDto, ReviewSummaryDto } from "../dtos/review.dto";
import { ReviewFilterParams } from "../params/review.params";
import { IReviewRepository } from "./interfaces/ireview.repository";
import { toUserSummary, userSummarySelect } from "./user-profile.mapper";

// Review has no storeCode of its own - it is scoped through the product it is
// written against, so every tenant filter goes through the relation.
const reviewInclude = {
    user: { select: userSummarySelect },
    product: { select: { id: true, name: true, slug: true, images: true, storeCode: true } },
    ReviewReply: {
        include: { user: { select: userSummarySelect } },
        orderBy: { createdAt: 'asc' as const },
    },
};

type ReviewWithRelations = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;

// Sorting is client-driven, so only real columns are honoured - anything else
// falls back to the default instead of failing the query.
const SORTABLE_COLUMNS = new Set(['rating', 'createdAt', 'updatedAt', 'status', 'isVerified']);

function toDto(review: ReviewWithRelations): ReviewDto {
    return {
        id: review.id,
        orderId: review.orderId,
        productId: review.productId,
        userId: review.userId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images,
        isVerified: review.isVerified,
        status: review.status,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        user: toUserSummary(review.user),
        product: review.product,
        replies: review.ReviewReply.map((reply) => ({
            id: reply.id,
            reviewId: reply.reviewId,
            userId: reply.userId,
            comment: reply.comment,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
            user: toUserSummary(reply.user),
        })),
    };
}

export class ReviewRepository implements IReviewRepository {
    async findAll(filters?: ReviewFilterParams): Promise<ListResponseDto<ReviewDto>> {
        let page = 1;
        let limit = 10;
        const where: Prisma.ReviewWhereInput = { NOT: { status: Status.Trash } };

        if (filters) {
            page = filters.page ?? page;
            limit = filters.recordPerPage ?? limit;

            if (filters.search) {
                where.OR = [
                    { title: { contains: filters.search, mode: 'insensitive' } },
                    { comment: { contains: filters.search, mode: 'insensitive' } },
                    { product: { name: { contains: filters.search, mode: 'insensitive' } } },
                    { user: { name: { contains: filters.search, mode: 'insensitive' } } },
                ];
            }

            if (filters.status !== undefined) {
                where.status = filters.status;
                delete where.NOT;
            }

            if (filters.productId !== undefined) where.productId = filters.productId;
            if (filters.orderId !== undefined) where.orderId = filters.orderId;
            if (filters.userId !== undefined) where.userId = filters.userId;
            if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;

            if (filters.rating !== undefined) {
                where.rating = filters.rating;
            } else if (filters.minRating !== undefined) {
                where.rating = { gte: filters.minRating };
            }

            // Tenancy lives on the product, not on the review.
            if (filters.storeCode !== undefined) {
                where.product = { ...(where.product as object), storeCode: filters.storeCode };
            }

            if (filters.startDate != null || filters.endDate != null) {
                where.createdAt = {
                    ...(filters.startDate != null && { gte: filters.startDate }),
                    ...(filters.endDate != null && { lte: filters.endDate }),
                };
            }
        }

        const column = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
        const direction: Prisma.SortOrder = filters?.sortOrder === 'asc' ? 'asc' : 'desc';

        const showAll = filters?.showAllRecords === true;
        const skip = showAll ? undefined : (page - 1) * limit;
        const take = showAll ? undefined : limit;

        const [data, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: reviewInclude,
                orderBy: [{ [column]: direction }, { id: 'desc' }],
                ...(skip !== undefined && { skip }),
                ...(take !== undefined && { take }),
            }),
            prisma.review.count({ where }),
        ]);

        return { totalRecord: total, data: data.map(toDto) };
    }

    // `tx` matters when the caller is inside a transaction: a read on the global client
    // cannot see rows the open transaction has not committed yet.
    async findById(id: number, tx: Prisma.TransactionClient = prisma): Promise<ReviewDto | null> {
        const review = await tx.review.findUnique({ where: { id }, include: reviewInclude });
        return review ? toDto(review) : null;
    }

    async delete(id: number): Promise<ReviewDto> {
        const review = await prisma.review.update({
            where: { id },
            data: { status: Status.Trash },
            include: reviewInclude,
        });
        return toDto(review);
    }

    async getSummary(productId: number): Promise<ReviewSummaryDto> {
        const where: Prisma.ReviewWhereInput = { productId, status: Status.Published };

        const [grouped, aggregate] = await Promise.all([
            prisma.review.groupBy({ by: ['rating'], where, _count: { rating: true } }),
            prisma.review.aggregate({ where, _avg: { rating: true }, _count: { rating: true } }),
        ]);

        const ratingCounts: ReviewSummaryDto['ratingCounts'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const row of grouped) {
            const star = row.rating as 1 | 2 | 3 | 4 | 5;
            if (star >= 1 && star <= 5) ratingCounts[star] = row._count.rating;
        }

        return {
            productId,
            // One decimal is all the UI shows, and it keeps the value stable in JSON.
            averageRating: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : 0,
            totalReviews: aggregate._count.rating,
            ratingCounts,
        };
    }
}
