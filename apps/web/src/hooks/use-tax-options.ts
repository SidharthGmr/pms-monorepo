import { useGetAllTaxes } from '@/hooks/service-hooks/useTaxService';
import DropdownBasicDto from '@/types/dropdown-basic.dto';
import { TaxCategoryEnum, TaxDto } from '@pms/types';
import { useMemo } from 'react';

interface UseTaxOptionsArgs {
  /** Adds a leading "none" row, e.g. 'No tax'. Omit it where the field is only shown when a tax is required. */
  emptyLabel?: string;
}

interface UseTaxOptionsResult {
  taxes: TaxDto[];
  taxById: Map<string, TaxDto>;
  options: DropdownBasicDto[];
  /** The rate a document should actually charge: exempt and zero-rated taxes contribute nothing. */
  rateFor: (taxId?: string | null) => number;
}

/**
 * The one place a tax picker gets its options, so every form that charges GST offers the same
 * list and writes the same label. Each screen used to build this itself, which is how the
 * estimate line ended up offering taxes that had been deactivated while the variant form
 * filtered them out - the same picker, disagreeing about what exists.
 *
 * Only active taxes are listed: a rate you have retired must not be chargeable on a new
 * document, and an old document keeps its own snapshotted rate regardless.
 */
export function useTaxOptions({ emptyLabel }: UseTaxOptionsArgs = {}): UseTaxOptionsResult {
  const { data } = useGetAllTaxes({ showAllRecords: true, isActive: true });
  const taxes = useMemo(() => data?.data?.data?.data ?? [], [data]);

  const taxById = useMemo(() => new Map(taxes.map((tax) => [tax.id, tax] as const)), [taxes]);

  // Tax names in this application are already written as "GST@18%", so the rate is only
  // appended when the name does not carry it - otherwise the row reads "GST@18% · 18%".
  const options = useMemo<DropdownBasicDto[]>(() => {
    const rows = taxes.map((tax) => ({
      value: tax.id,
      label: tax.name.includes('%') ? tax.name : `${tax.name} · ${tax.rate}%`,
    }));
    return emptyLabel ? [{ value: '', label: emptyLabel }, ...rows] : rows;
  }, [taxes, emptyLabel]);

  const rateFor = useMemo(() => {
    return (taxId?: string | null) => {
      if (!taxId) return 0;
      const tax = taxById.get(taxId);
      return tax && tax.category === TaxCategoryEnum.Taxable ? tax.rate : 0;
    };
  }, [taxById]);

  return { taxes, taxById, options, rateFor };
}
