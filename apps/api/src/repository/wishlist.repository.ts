import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ListResponseDto } from "../dtos/list-response.dto";
import { WishlistDto } from "../dtos/wishlist.dto";
import { WishlistFilterParams } from "../params/wishlist.params";
import { IWishlistRepository } from "./interfaces/iwishlist.repository";
import { toUserSummary, userSummarySelect } from "./user-profile.mapper";

const wishlistInclude = {
    product: { select: { id: true, name: true, slug: true, images: true, storeCode: true, status: true } },
    // Null on a product-level save; when present it is what the listing shows instead of
    // the bare product name, so the shopper sees which size/colour they saved.
    variant: { select: { id: true, sku: true, name: true, attributes: true, images: true, isActive: true } },
    // Staff listings show who saved the item, so the owner travels with the row
    // instead of forcing the client to resolve every userId separately.
    user: { select: userSummarySelect },
};

type WishlistWithProduct = Prisma.WishlistGetPayload<{ include: typeof wishlistInclude }>;

const SORTABLE_COLUMNS = new Set(['addedAt', 'productId', 'variantId']);

function toDto(entry: WishlistWithProduct): WishlistDto {
    return {
        id: entry.id,
        userId: entry.userId,
        productId: entry.productId,
        variantId: entry.variantId,
        storeCode: entry.storeCode,
        addedAt: entry.addedAt,
        product: entry.product,
        variant: entry.variant,
        user: toUserSummary(entry.user),
    };
}

export class WishlistRepository implements IWishlistRepository {
    async findAll(filters?: WishlistFilterParams): Promise<ListResponseDto<WishlistDto>> {
        let page = 1;
        let limit = 10;
        const where: Prisma.WishlistWhereInput = {};

        if (filters) {
            page = filters.page ?? page;
            limit = filters.recordPerPage ?? limit;

            if (filters.userId !== undefined) where.userId = filters.userId;
            if (filters.productId !== undefined) where.productId = filters.productId;
            if (filters.variantId !== undefined) where.variantId = filters.variantId;
            if (filters.storeCode !== undefined) where.storeCode = filters.storeCode;

            if (filters.search) {
                where.product = { name: { contains: filters.search, mode: 'insensitive' } };
            }

            if (filters.startDate != null || filters.endDate != null) {
                where.addedAt = {
                    ...(filters.startDate != null && { gte: filters.startDate }),
                    ...(filters.endDate != null && { lte: filters.endDate }),
                };
            }
        }

        const column = filters?.sortBy && SORTABLE_COLUMNS.has(filters.sortBy) ? filters.sortBy : 'addedAt';
        const direction: Prisma.SortOrder = filters?.sortOrder === 'asc' ? 'asc' : 'desc';

        const showAll = filters?.showAllRecords === true;
        const skip = showAll ? undefined : (page - 1) * limit;
        const take = showAll ? undefined : limit;

        const [data, total] = await Promise.all([
            prisma.wishlist.findMany({
                where,
                include: wishlistInclude,
                orderBy: [{ [column]: direction }, { id: 'desc' }],
                ...(skip !== undefined && { skip }),
                ...(take !== undefined && { take }),
            }),
            prisma.wishlist.count({ where }),
        ]);

        return { totalRecord: total, data: data.map(toDto) };
    }

    // `tx` matters when the caller is inside a transaction: a read on the global client
    // cannot see rows the open transaction has not committed yet.
    async findById(id: number, tx: Prisma.TransactionClient = prisma): Promise<WishlistDto | null> {
        const entry = await tx.wishlist.findUnique({ where: { id }, include: wishlistInclude });
        return entry ? toDto(entry) : null;
    }

    /**
     * With `variantId` this targets that exact save. Without it, any SKU of the product
     * matches - every row pins a variant now, so "is this product saved?" can only mean
     * "is one of its SKUs saved?". That is what the product-page heart asks.
     */
    async findByUserAndProduct(userId: string, productId: number, variantId?: number): Promise<WishlistDto | null> {
        const entry = await prisma.wishlist.findFirst({
            where: { userId, productId, ...(variantId !== undefined && { variantId }) },
            include: wishlistInclude,
        });
        return entry ? toDto(entry) : null;
    }

    /** Backs the variant grid's heart, where the product id is not what the shopper picked. */
    async findByUserAndVariant(userId: string, variantId: number): Promise<WishlistDto | null> {
        const entry = await prisma.wishlist.findFirst({
            where: { userId, variantId },
            include: wishlistInclude,
        });
        return entry ? toDto(entry) : null;
    }

    async delete(id: number): Promise<WishlistDto> {
        const entry = await prisma.wishlist.delete({ where: { id }, include: wishlistInclude });
        return toDto(entry);
    }
}
