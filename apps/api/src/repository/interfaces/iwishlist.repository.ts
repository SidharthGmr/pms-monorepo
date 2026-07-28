import { Prisma } from "@prisma/client";
import { WishlistDto } from "../../dtos/wishlist.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { WishlistFilterParams } from "../../params/wishlist.params";

export interface IWishlistRepository {
    findAll(filters?: WishlistFilterParams): Promise<ListResponseDto<WishlistDto>>;
    /** Pass `tx` when reading back a row written inside an open transaction. */
    findById(id: number, tx?: Prisma.TransactionClient): Promise<WishlistDto | null>;
    /** Backs both the "is this saved?" check and remove-by-product. */
    findByUserAndProduct(userId: string, productId: number): Promise<WishlistDto | null>;
    /** Hard delete - a wishlist entry has no status column to soft-delete into. */
    delete(id: number): Promise<WishlistDto>;
}
