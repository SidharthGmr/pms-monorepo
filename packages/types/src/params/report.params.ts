import { PartyType } from '../enum/party-type.enum';

export interface ProfitLossParams {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  /** Include vouchers that have been reversed; off by default so the report reads clean. */
  includeReversed?: boolean;
}

export interface PartyStatementParams {
  partyType: PartyType | string;
  partyId: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  includeReversed?: boolean;
}
