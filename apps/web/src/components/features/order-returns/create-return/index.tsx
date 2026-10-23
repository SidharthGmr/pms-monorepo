'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useCreateOrderReturn, useGetReturnedQuantities } from '@/hooks/service-hooks/useOrderReturnService';
import { useGetAllPublicProductVariants } from '@/hooks/service-hooks/useProductVariantService';
import { formatPrice } from '@/lib/format-price';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { OrderDto, PaymentMethod, PaymentMethodEnum, ReturnItemCondition, ReturnItemConditionEnum, ReturnTypeEnum, Roles } from '@pms/types';
import { ArrowLeftRight, Plus, Trash2, Undo2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';

const REFUND_METHODS: PaymentMethod[] = [
  PaymentMethodEnum.Cash,
  PaymentMethodEnum.Card,
  PaymentMethodEnum.Upi,
  PaymentMethodEnum.BankTransfer,
  PaymentMethodEnum.Online,
];

interface LineState {
  quantity: number;
  condition: ReturnItemCondition;
}

interface ExchangeLine {
  variantId?: number;
  quantity: number;
}

interface CreateReturnDialogProps {
  order: OrderDto;
  isOpen: boolean;
  /** `true` when a return was created, so the caller refreshes its order. */
  onClose: (created: boolean) => void;
}

export default function CreateReturnDialog({ order, isOpen, onClose }: CreateReturnDialogProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === Roles.ADMIN || role === Roles.SUPER_ADMIN;

  const createMutation = useCreateOrderReturn();
  const returnedQuery = useGetReturnedQuantities(order.id, isOpen);
  const returnedByItem = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of returnedQuery.data?.data?.data ?? []) map.set(row.orderItemId, row.quantity);
    return map;
  }, [returnedQuery.data]);

  const { data: variantsResponse } = useGetAllPublicProductVariants({ showAllRecords: true });
  const variantOptions = useMemo(
    () =>
      (variantsResponse?.data?.data?.data || []).map((variant) => ({
        label: variant.name ? (variant.sku ? `${variant.name} (${variant.sku})` : variant.name) : variant.sku,
        value: variant.id,
      })),
    [variantsResponse]
  );

  const [type, setType] = useState<ReturnTypeEnum>(ReturnTypeEnum.Refund);
  const [lines, setLines] = useState<Record<number, LineState>>({});
  const [exchangeLines, setExchangeLines] = useState<ExchangeLine[]>([{ variantId: undefined, quantity: 1 }]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod | ''>('');
  const [overrideWindow, setOverrideWindow] = useState(false);

  const items = order.items ?? [];
  const remainingFor = (orderItemId: number, sold: number) => Math.max(0, sold - (returnedByItem.get(orderItemId) ?? 0));

  const setLine = (orderItemId: number, patch: Partial<LineState>) =>
    setLines((current) => {
      const previous = current[orderItemId] ?? { quantity: 0, condition: ReturnItemConditionEnum.Sellable };
      return { ...current, [orderItemId]: { ...previous, ...patch } };
    });

  const pickedLines = items
    .map((item) => ({ item, state: lines[item.id!] }))
    .filter((entry) => entry.state && entry.state.quantity > 0)
    .map((entry) => ({
      orderItemId: entry.item.id!,
      quantity: entry.state.quantity,
      condition: entry.state.condition,
      amount: (entry.item.unitPrice ?? 0) * entry.state.quantity,
    }));

  const returnValue = pickedLines.reduce((sum, line) => sum + line.amount, 0);

  const submit = async () => {
    if (pickedLines.length === 0) {
      toast({ variant: 'destructive', title: 'Pick at least one item to return' });
      return;
    }
    if (!reason.trim()) {
      toast({ variant: 'destructive', title: 'A reason is required' });
      return;
    }
    const exchangeItems = exchangeLines.filter((line) => line.variantId && line.quantity > 0).map((line) => ({ variantId: line.variantId!, quantity: line.quantity }));
    if (type === ReturnTypeEnum.Exchange && exchangeItems.length === 0) {
      toast({ variant: 'destructive', title: 'Pick at least one replacement item' });
      return;
    }

    try {
      const response = await createMutation.mutateAsync({
        orderId: order.id,
        type,
        reason: reason.trim(),
        notes: notes.trim() || null,
        refundMethod: refundMethod || null,
        overrideWindow: overrideWindow || undefined,
        items: pickedLines.map(({ orderItemId, quantity, condition }) => ({ orderItemId, quantity, condition })),
        exchangeItems: type === ReturnTypeEnum.Exchange ? exchangeItems : undefined,
      });
      if (response.status === 201) {
        toast({ variant: 'success', title: `${type === ReturnTypeEnum.Exchange ? 'Exchange' : 'Refund'} ${response.data.data?.returnNumber ?? ''} created` });
        onClose(true);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: unitOfService.ErrorHandlerService.getErrorMessage(response) });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: unitOfService.ErrorHandlerService.getErrorMessage((error as { response?: never })?.response ?? (error as never)),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Return / Exchange</DialogTitle>
          <DialogDescription>
            Invoice {order.orderNumber} · pick what is coming back. Prices follow what was actually paid on this invoice.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(value) => setType(value as ReturnTypeEnum)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={ReturnTypeEnum.Refund} className="gap-1.5">
              <Undo2 className="h-3.5 w-3.5" />
              Refund
            </TabsTrigger>
            <TabsTrigger value={ReturnTypeEnum.Exchange} className="gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Exchange
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Sold item</th>
                <th className="px-3 py-2 text-right font-semibold">Returnable</th>
                <th className="px-3 py-2 text-right font-semibold">Return qty</th>
                <th className="px-3 py-2 text-left font-semibold">Condition</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const remaining = remainingFor(item.id!, item.quantity ?? 0);
                const state = lines[item.id!];
                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2">
                      <p className="max-w-[220px] truncate font-medium">{item.variant?.name ?? `Variant #${item.variantId}`}</p>
                      <p className="text-[11px] text-muted-foreground">{formatPrice(item.unitPrice ?? 0)} each</p>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {remaining} / {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        min={0}
                        max={remaining}
                        disabled={remaining === 0}
                        value={state?.quantity ?? 0}
                        onChange={(e) => setLine(item.id!, { quantity: Math.max(0, Math.min(remaining, Number(e.target.value) || 0)) })}
                        className="ml-auto h-8 w-20 text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={state?.condition ?? ReturnItemConditionEnum.Sellable}
                        onValueChange={(value) => setLine(item.id!, { condition: value as ReturnItemCondition })}
                        disabled={remaining === 0}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ReturnItemConditionEnum.Sellable}>Sellable</SelectItem>
                          <SelectItem value={ReturnItemConditionEnum.Damaged}>Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {type === ReturnTypeEnum.Exchange && (
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <p className="text-sm font-medium">Replacement items</p>
            {exchangeLines.map((line, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <SelectSearch
                    buttonClass="w-full h-9 font-normal"
                    placeholder="Pick a product variant…"
                    items={variantOptions}
                    value={line.variantId ?? ''}
                    valueType="number"
                    containerName={`exchange-variant-${index}`}
                    onChange={(value) =>
                      setExchangeLines((current) =>
                        current.map((entry, i) => (i === index ? { ...entry, variantId: value === '' ? undefined : Number(value) } : entry))
                      )
                    }
                  />
                </div>
                <Input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) =>
                    setExchangeLines((current) => current.map((entry, i) => (i === index ? { ...entry, quantity: Math.max(1, Number(e.target.value) || 1) } : entry)))
                  }
                  className="h-9 w-20 text-right"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0 text-destructive"
                  disabled={exchangeLines.length === 1}
                  onClick={() => setExchangeLines((current) => current.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setExchangeLines((current) => [...current, { variantId: undefined, quantity: 1 }])}>
              <Plus className="h-3.5 w-3.5" />
              Add replacement
            </Button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>
              Reason <span className="text-destructive">*</span>
            </Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Wrong size, defective, changed mind…" />
          </div>
          <div className="space-y-1.5">
            <Label>Refund method</Label>
            <Select value={refundMethod} onValueChange={(value) => setRefundMethod(value as PaymentMethod)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Decide later" />
              </SelectTrigger>
              <SelectContent>
                {REFUND_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} className="min-h-9 resize-none" />
          </div>
        </div>

        {isAdmin && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={overrideWindow} onCheckedChange={(checked) => setOverrideWindow(checked === true)} />
            Accept outside the return window (admin override)
          </label>
        )}

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Return value</p>
            <p className="text-lg font-bold tabular-nums">{formatPrice(returnValue)}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void submit()} loading={createMutation.isPending} disabled={pickedLines.length === 0}>
              {type === ReturnTypeEnum.Exchange ? 'Create exchange' : 'Create refund'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
