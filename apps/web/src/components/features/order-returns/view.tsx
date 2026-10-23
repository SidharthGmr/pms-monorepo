'use client';
import ConfirmBox from '@/components/common/confirm-box';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetOrderReturnById, useUpdateOrderReturnStatus } from '@/hooks/service-hooks/useOrderReturnService';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { OrderReturnDto, PaymentMethod, PaymentMethodEnum, ReturnItemConditionEnum, ReturnStatusEnum, ReturnTypeEnum, Roles } from '@pms/types';
import { format } from 'date-fns';
import { ArrowLeftRight, Ban, Check, CheckCheck, PackageCheck, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { returnToneFor, RETURN_TRANSITIONS, RETURN_TYPE_LABEL } from './return-status';

const REFUND_METHODS: PaymentMethod[] = [
  PaymentMethodEnum.Cash,
  PaymentMethodEnum.Card,
  PaymentMethodEnum.Upi,
  PaymentMethodEnum.BankTransfer,
  PaymentMethodEnum.Online,
];

const ACTION_META: Record<string, { label: string; icon: typeof Check; variant?: 'destructive' | 'outline' }> = {
  [ReturnStatusEnum.Approved]: { label: 'Approve', icon: Check },
  [ReturnStatusEnum.Received]: { label: 'Mark received', icon: PackageCheck },
  [ReturnStatusEnum.Completed]: { label: 'Complete', icon: CheckCheck },
  [ReturnStatusEnum.Rejected]: { label: 'Reject', icon: X, variant: 'destructive' },
  [ReturnStatusEnum.Cancelled]: { label: 'Cancel request', icon: Ban, variant: 'outline' },
};

// Mirrors ADMIN_ONLY_TARGETS in the API service, so staff never see a button the API would 403.
const ADMIN_ONLY = new Set<string>([ReturnStatusEnum.Approved, ReturnStatusEnum.Rejected, ReturnStatusEnum.Completed]);

interface OrderReturnViewProps {
  id: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderReturnView({ id, isOpen, onClose }: OrderReturnViewProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === Roles.ADMIN || role === Roles.SUPER_ADMIN;

  const getResponse = useGetOrderReturnById(id, isOpen);
  const statusMutation = useUpdateOrderReturnStatus();

  const [pendingTarget, setPendingTarget] = useState<ReturnStatusEnum | null>(null);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod | ''>('');
  const [transactionId, setTransactionId] = useState('');

  const orderReturn: OrderReturnDto | undefined = getResponse.data?.data?.data;
  const tone = returnToneFor(orderReturn?.status);
  const transitions = orderReturn ? (RETURN_TRANSITIONS[orderReturn.status] ?? []).filter((target) => isAdmin || !ADMIN_ONLY.has(target)) : [];
  const needsRefundDetails = pendingTarget === ReturnStatusEnum.Completed && (orderReturn?.refundAmount ?? 0) > 0;

  const applyStatus = async (target: ReturnStatusEnum) => {
    if (!orderReturn) return;
    const response = await statusMutation.mutateAsync({
      id: orderReturn.id,
      model: {
        status: target,
        refundMethod: needsRefundDetails ? (refundMethod as PaymentMethod) || orderReturn.refundMethod || null : undefined,
        refundTransactionId: needsRefundDetails && transactionId ? transactionId : undefined,
      },
    });
    if (response.status === 200) {
      toast({ variant: 'success', title: `Return ${ACTION_META[target]?.label.toLowerCase() ?? 'updated'}` });
      setPendingTarget(null);
      setRefundMethod('');
      setTransactionId('');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: unitOfService.ErrorHandlerService.getErrorMessage(response) });
    }
  };

  const confirmStatus = async () => {
    if (!pendingTarget || !orderReturn) return;
    if (needsRefundDetails && !(refundMethod || orderReturn.refundMethod)) {
      toast({ variant: 'destructive', title: 'Pick how the refund is paid out' });
      return;
    }
    try {
      await applyStatus(pendingTarget);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: unitOfService.ErrorHandlerService.getErrorMessage((error as { response?: never })?.response ?? (error as never)),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {getResponse.isPending || !orderReturn ? (
          <div className="space-y-3 py-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 font-mono">
                {orderReturn.returnNumber}
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', tone.soft, tone.text)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
                  {tone.label}
                </span>
                <Badge variant="outline" className="gap-1 font-sans font-medium">
                  {orderReturn.type === ReturnTypeEnum.Exchange && <ArrowLeftRight className="h-3 w-3" />}
                  {RETURN_TYPE_LABEL[orderReturn.type] ?? orderReturn.type}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Invoice {orderReturn.order?.orderNumber ?? `#${orderReturn.orderId}`}
                {orderReturn.customer?.name ? ` · ${orderReturn.customer.name}` : ''} · requested{' '}
                {format(new Date(orderReturn.createdAt), 'dd MMM yyyy, hh:mm a')}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <p>
                <span className="font-medium">Reason:</span> {orderReturn.reason}
              </p>
              {orderReturn.notes && <p className="mt-1 text-muted-foreground">{orderReturn.notes}</p>}
            </div>

            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Item</th>
                    <th className="px-3 py-2 text-right font-semibold">Qty</th>
                    <th className="px-3 py-2 text-left font-semibold">Condition</th>
                    <th className="px-3 py-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(orderReturn.items ?? []).map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.variant?.name ?? item.product?.name ?? `Variant #${item.variantId}`}</p>
                        {item.variant?.sku && <p className="text-[11px] text-muted-foreground">{item.variant.sku}</p>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-3 py-2">
                        <Badge variant={item.condition === ReturnItemConditionEnum.Damaged ? 'destructive' : 'secondary'} className="font-normal">
                          {item.condition === ReturnItemConditionEnum.Damaged ? 'Damaged' : 'Sellable'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatPrice(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Refund to customer</p>
                <p className="text-lg font-bold tabular-nums">{formatPrice(orderReturn.refundAmount)}</p>
              </div>
              <div className="text-right text-sm">
                {orderReturn.refundMethod && <p className="font-medium">{orderReturn.refundMethod}</p>}
                {orderReturn.refundTransactionId && <p className="text-[11px] text-muted-foreground">Txn {orderReturn.refundTransactionId}</p>}
                {orderReturn.exchangeOrder && (
                  <p className="text-[11px] text-muted-foreground">
                    Exchange invoice <span className="font-mono">{orderReturn.exchangeOrder.orderNumber}</span> ·{' '}
                    {formatPrice(orderReturn.exchangeOrder.grandTotal)} due
                  </p>
                )}
              </div>
            </div>

            {transitions.length > 0 && (
              <>
                <Separator />
                {pendingTarget && needsRefundDetails ? (
                  <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <p className="text-sm font-medium">Paying out {formatPrice(orderReturn.refundAmount)} - record how:</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Refund method</Label>
                        <Select value={refundMethod || orderReturn.refundMethod || ''} onValueChange={(value) => setRefundMethod(value as PaymentMethod)}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Pick a method" />
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
                        <Label>Transaction id (optional)</Label>
                        <Input className="h-9" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="UPI ref, card slip…" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setPendingTarget(null)} disabled={statusMutation.isPending}>
                        Back
                      </Button>
                      <Button type="button" size="sm" onClick={() => void confirmStatus()} loading={statusMutation.isPending}>
                        Confirm payout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-end gap-2">
                    {transitions.map((target) => {
                      const meta = ACTION_META[target];
                      const Icon = meta.icon;
                      return (
                        <Button
                          key={target}
                          type="button"
                          size="sm"
                          variant={meta.variant ?? 'default'}
                          className="gap-1.5"
                          disabled={statusMutation.isPending}
                          onClick={() => {
                            if (target === ReturnStatusEnum.Completed && orderReturn.refundAmount > 0) setPendingTarget(target);
                            else setPendingTarget(target);
                          }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {meta.label}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {pendingTarget && !needsRefundDetails && (
              <ConfirmBox
                isOpen
                onClose={() => setPendingTarget(null)}
                onSubmit={() => void confirmStatus()}
                heading="Update return"
                loading={statusMutation.isPending}
                bodyText={`${ACTION_META[pendingTarget]?.label ?? 'Update'} ${orderReturn.returnNumber}?${
                  pendingTarget === ReturnStatusEnum.Received ? ' Sellable items go back into stock.' : ''
                }${
                  (pendingTarget === ReturnStatusEnum.Rejected || pendingTarget === ReturnStatusEnum.Cancelled) && orderReturn.exchangeOrderId
                    ? ' Its exchange invoice is cancelled and restocked too.'
                    : ''
                }`}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
