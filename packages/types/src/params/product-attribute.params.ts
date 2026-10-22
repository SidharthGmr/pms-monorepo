import { Status } from '../enum/status.enum';
import { PageFilterParams } from './page.params';

export interface ProductAttributeFilterParams extends PageFilterParams {
  productId?: number | null;
  attributeId?: number;
  status?: Status | string | null;
}
