'use client';
import MasterEntrySelect from '@/components/common/master-entry-select';
import { SelectSearch } from '@/components/common/select-search';


import { X } from 'lucide-react';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { MasterAttributeDto, CreateProductModel } from '@pms/types';

interface VariantOptionRowsProps {
  variantIndex: number;
  masterAttributes: MasterAttributeDto[];
}

/**
 * The option picks on an inline variant row. Only the attributes this variant actually uses
 * get a picker - the attribute catalog can hold dozens, so "Add option" is a searchable menu
 * of the unused ones rather than a select per attribute. An added attribute stays local
 * until its value is picked, so the form only ever holds complete pairs; the picks become
 * the variant's attributes JSON, kept in master-attribute order so two admins choosing the
 * same options in a different order still produce the same variant name and SKU.
 */
export default function VariantOptionRows({ variantIndex, masterAttributes }: VariantOptionRowsProps) {
  const { control, setValue } = useFormContext<CreateProductModel>();
  const rows = useWatch({ control, name: `variants.${variantIndex}.attributes` }) ?? [];
  // Attributes added via the menu whose value has not been picked yet.
  const [pending, setPending] = useState<number[]>([]);

  const pickedIds = rows.filter((row) => row?.attributeid != null).map((row) => row!.attributeid as number);
  const shown = masterAttributes.filter((attribute) => pickedIds.includes(attribute.id) || pending.includes(attribute.id));
  const unused = masterAttributes.filter((attribute) => !pickedIds.includes(attribute.id) && !pending.includes(attribute.id));

  const valueFor = (attributeId: number) => rows.find((row) => row?.attributeid === attributeId)?.attributeValueId ?? '';
  const pick = (attributeId: number, valueId: number | null) => {
    const next = rows.filter((row) => row?.attributeid != null && row.attributeid !== attributeId);
    if (valueId != null) next.push({ attributeid: attributeId, attributeValueId: valueId });
    const order = (row: { attributeid: number }) => masterAttributes.findIndex((attribute) => attribute.id === row.attributeid);
    next.sort((a, b) => order(a as { attributeid: number }) - order(b as { attributeid: number }));
    setValue(`variants.${variantIndex}.attributes`, next as { attributeid: number; attributeValueId: number }[], { shouldDirty: true });
    if (valueId != null) setPending((ids) => ids.filter((id) => id !== attributeId));
  };
  const remove = (attributeId: number) => {
    pick(attributeId, null);
    setPending((ids) => ids.filter((id) => id !== attributeId));
  };

  if (masterAttributes.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Options</p>
        {unused.length > 0 && (
          <SelectSearch
            items={unused.map((attribute) => ({ label: attribute.name, value: attribute.id }))}
            value=""
            valueType="number"
            placeholder="+ Add option"
            buttonClass="h-7 w-auto gap-1 border-dashed px-2 text-xs text-muted-foreground hover:text-foreground"
            containerName={`variant-${variantIndex}-add-option`}
            onChange={(value) => {
              if (value) setPending((ids) => [...ids, Number(value)]);
            }}
          />
        )}
      </div>

      {shown.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">No options — this variant sells as the product itself.</p>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {shown.map((attribute) => (
            <div key={attribute.id}>
              <div className="flex h-5 items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">{attribute.name}</span>
                <button
                  type="button"
                  onClick={() => remove(attribute.id)}
                  aria-label={`Remove ${attribute.name}`}
                  title={`Remove ${attribute.name}`}
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <MasterEntrySelect
                attributeCode={attribute.code}
                bindTo="id"
                showColorSwatch
                value={valueFor(attribute.id)}
                onChange={(value) => pick(attribute.id, value ? Number(value) : null)}
                buttonClass="h-9 w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
