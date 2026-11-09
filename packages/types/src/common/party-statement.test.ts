import { describe, expect, it } from 'vitest';
import { PartyTypeEnum } from '../enum/party-type.enum';
import { buildPartyStatement, partyNature } from './party-statement';

const move = (debit: number, credit: number) => ({ ledgerAccountId: 1, debit, credit });

describe('buildPartyStatement', () => {
  it('reads a customer debit-normal: a sale raises what they owe, a receipt lowers it', () => {
    const statement = buildPartyStatement({
      partyType: PartyTypeEnum.Customer,
      openingDebit: 0,
      openingCredit: 0,
      movements: [move(3540, 0), move(0, 1500)],
    });
    expect(statement.nature).toBe('DEBIT');
    expect(statement.rows.map((row) => row.balance)).toEqual([3540, 2040]);
    expect(statement.closingBalance).toBe(2040);
  });

  it('reads a supplier credit-normal: a bill raises what we owe, a payment lowers it', () => {
    const statement = buildPartyStatement({
      partyType: PartyTypeEnum.Supplier,
      openingDebit: 0,
      openingCredit: 0,
      movements: [move(0, 2360), move(2360, 0)],
    });
    expect(statement.nature).toBe('CREDIT');
    expect(statement.rows.map((row) => row.balance)).toEqual([2360, 0]);
    expect(statement.closingBalance).toBe(0);
  });

  it('shows a customer advance as a negative balance - we owe them, not the reverse', () => {
    const statement = buildPartyStatement({
      partyType: PartyTypeEnum.Customer,
      openingDebit: 0,
      openingCredit: 0,
      // A receipt with nothing to allocate credits Advance from Customer, tagged to the party.
      movements: [move(0, 500)],
    });
    expect(statement.closingBalance).toBe(-500);
  });

  it('derives the opening balance from the raw sums in the party direction', () => {
    const customer = buildPartyStatement({ partyType: PartyTypeEnum.Customer, openingDebit: 5000, openingCredit: 1200, movements: [] });
    expect(customer.openingBalance).toBe(3800);
    expect(customer.closingBalance).toBe(3800);

    const supplier = buildPartyStatement({ partyType: PartyTypeEnum.Supplier, openingDebit: 1200, openingCredit: 5000, movements: [] });
    expect(supplier.openingBalance).toBe(3800);
  });

  it('carries the opening balance through the window and totals both sides', () => {
    const statement = buildPartyStatement({
      partyType: PartyTypeEnum.Customer,
      openingDebit: 1000,
      openingCredit: 0,
      movements: [move(250.5, 0), move(0, 100.25)],
    });
    expect(statement.totalDebit).toBe(250.5);
    expect(statement.totalCredit).toBe(100.25);
    expect(statement.closingBalance).toBe(1150.25);
  });

  it('matches the outstanding figure: closing equals debit minus credit for a customer', () => {
    // The payments screen derives outstanding as sum(debit) - sum(credit) over the same
    // lines, so the statement's closing balance must land on the identical number.
    const statement = buildPartyStatement({
      partyType: PartyTypeEnum.Customer,
      openingDebit: 0,
      openingCredit: 0,
      movements: [move(5911.6, 0), move(0, 1500), move(19.5, 0)],
    });
    expect(statement.closingBalance).toBe(5911.6 - 1500 + 19.5);
  });

  it('names the direction for both party kinds', () => {
    expect(partyNature(PartyTypeEnum.Customer)).toBe('DEBIT');
    expect(partyNature(PartyTypeEnum.Supplier)).toBe('CREDIT');
  });
});
