import { WishlistDto } from "../../dtos/wishlist.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { WishlistFilterParams } from "../../params/wishlist.params";
import { ReviewActor } from "./Ireview.service";

export interface IWishlistService {
    getAll(filters?: WishlistFilterParams): Promise<ListResponseDto<WishlistDto>>;
    getById(id: number, actor: ReviewActor): Promise<WishlistDto | null>;
    /** Adding an item already saved returns the existing row rather than erroring. */
    add(productId: number, userId: string, storeCode: string): Promise<WishlistDto>;
    remove(id: number, actor: ReviewActor): Promise<WishlistDto>;
    removeByProduct(productId: number, userId: string): Promise<WishlistDto>;
    /** Lets a product page show the filled/empty heart without fetching the list. */
    has(productId: number, userId: string): Promise<boolean>;
}
