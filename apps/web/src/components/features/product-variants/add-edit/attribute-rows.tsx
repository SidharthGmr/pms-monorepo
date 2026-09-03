'use client';
import MasterEntrySelect from '@/components/common/master-entry-select';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MasterAttributeDto, MasterEntryDto } from '@/dtos/master-entry.dto';
import { ProductVariantModel } from '@pms/types';
import { ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

const emptyRow = { attributeid: null, attributeValueId: null };

/**
 * Turns a variant's stored attributes JSON into form rows.
 *
 * The current shape is a list of `{ attributeid, attributeValueId }` master-data ids and passes
 * straight through. Rows saved before that migration hold the old `{ size: 'L' }` record, so the
 * key is matched to an attribute code and the value to one of its entries to recover the ids.
 * Anything that cannot be matched is left blank, so it is re-picked instead of saved wrong.
 */
export function toAttributeRows(attributes: unknown, masterAttributes: MasterAttributeDto[], masterEntries: MasterEntryDto[]) {
  if (Array.isArray(attributes)) {
    return attributes.map((row) => ({ attributeid: row?.attributeid ?? null, attributeValueId: row?.attributeValueId ?? null }));
  }
  if (!attributes || typeof attributes !== 'object') return [];

  return Object.entries(attributes).map(([code, value]) => {
    const attribute = masterAttributes.find((item) => item.code.toLowerCase() === code.toLowerCase());
    const entry = masterEntries.find((item) => item.attributeId === attribute?.id && item.value.toLowerCase() === String(value).toLowerCase());

    return { attributeid: attribute?.id ?? null, attributeValueId: entry?.id ?? null };
  });
}

interface AttributeRowsProps {
  masterAttributes: MasterAttributeDto[];
}

/** The `Size = L` rows on the variant form. Reads the form off `<Form>`'s context. */
export default function AttributeRows({ masterAttributes }: AttributeRowsProps) {
  const { control, setValue } = useFormContext<ProductVariantModel>();
  const { fields, append, remove } = useFieldArray({ control, name: 'attributes', keyName: 'key' });
  const rows = useWatch({ control, name: 'attributes' }) ?? [];

  return (
    <div className="space-y-3">
      {fields.length === 0 && <p className="text-sm text-muted-foreground">No attributes — this variant is the product’s only version.</p>}

      {fields.map((row, index) => {
        const attributeId = rows[index]?.attributeid ?? null;
        const attributeCode = masterAttributes.find((attribute) => attribute.id === attributeId)?.code;
        const usedElsewhere = rows.filter((_, i) => i !== index).map((item) => item?.attributeid);

        return (
          <div key={row.key} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto]">
            <FormField
              control={control}
              name={`attributes.${index}.attributeid`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attribute</FormLabel>
                  <FormControl>
                    <SelectSearch
                      items={masterAttributes
                        .filter((attribute) => attribute.id === attributeId || !usedElsewhere.includes(attribute.id))
                        .map((attribute) => ({ label: attribute.name, value: attribute.id }))}
                      value={field.value ?? ''}
                      valueType="number"
                      placeholder="Select attribute"
                      buttonClass="w-full"
                      containerName={`variant-attribute-${index}`}
                      onChange={(value) => {
                        field.onChange(value ? Number(value) : null);
                        setValue(`attributes.${index}.attributeValueId`, null);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`attributes.${index}.attributeValueId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    {attributeCode ? (
                      <MasterEntrySelect
                        attributeCode={attributeCode}
                        bindTo="id"
                        showColorSwatch
                        value={field.value ?? ''}
                        onChange={(value) => field.onChange(value ? Number(value) : null)}
                        buttonClass="w-full"
                      />
                    ) : (
                      <Button type="button" variant="outline" size="sm" disabled className="h-11 w-full justify-between font-normal">
                        Pick an attribute first
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-end">
              <Button type="button" variant="ghost" size="icon" aria-label="Remove attribute" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" disabled={fields.length >= masterAttributes.length} onClick={() => append(emptyRow)}>
        <Plus className="mr-2 h-4 w-4" />
        Add attribute
      </Button>
    </div>
  );
}
