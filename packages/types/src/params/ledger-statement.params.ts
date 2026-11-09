import { PartyType } from '../enum/party-type.enum';
import { PageFilterParams } from './page.params';

export interface LedgerStatementFilterParams extends PageFilterParams {
  /** Narrows a control account to one customer or supplier, which is how party ledgers work. */
  partyType?: PartyType | string;
  partyId?: string;
  /** Include vouchers that have been reversed; off by default so a statement reads clean. */
  includeReversed?: boolean;
}
