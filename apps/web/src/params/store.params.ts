import { PageFilterParams } from './product.params';

export interface StoreFilterParams extends PageFilterParams {
    status?: string | null;
    isActive?: boolean | null;
}
