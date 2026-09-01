import { WishlistDto } from "../../dtos/wishlist.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { WishlistFilterParams } from "../../params/wishlist.params";
import { ReviewActor } from "./Ireview.service";

export interface IWishlistService {
    /**
     * A save is keyed by SKU alone - the product and store are derived from the variant.
     * Adding something already saved returns the existing row rather than erroring, so the
     * heart need not know the current state on first render.
     */
    add(variantId: number, userId: string, storeCode: string): Promise<WishlistDto>;

    getAll(filters?: WishlistFilterParams): Promise<ListResponseDto<WishlistDto>>;
    getById(id: number, actor: ReviewActor): Promise<WishlistDto | null>;
    remove(id: number, actor: ReviewActor): Promise<WishlistDto>;
    /** Omitting `variantId` targets whichever SKU of the product is saved. */
    removeByProduct(productId: number, userId: string, variantId?: number): Promise<WishlistDto>;
    /** Lets a product page show the filled/empty heart without fetching the list. */
    has(productId: number, userId: string, variantId?: number): Promise<boolean>;
    /** The variant grid knows its SKU but not the parent product id. */
    removeByVariant(variantId: number, userId: string): Promise<WishlistDto>;
    hasVariant(variantId: number, userId: string): Promise<boolean>;
}
