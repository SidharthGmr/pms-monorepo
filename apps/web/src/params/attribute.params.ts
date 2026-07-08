import { PageFilterParams } from './product.params';

export interface AttributeFilterParams extends PageFilterParams {
    status?: string | null;
}
