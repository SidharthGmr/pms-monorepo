'use client';

import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';

import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { useGetActiveCart } from '@/hooks/service-hooks/useCartService';
import { useCheckoutDirect, useCreateRazorpayOrder, useVerifyRazorpayPayment } from '@/hooks/service-hooks/useCheckoutService';
import { useGetAllUserList } from '@/hooks/service-hooks/useUserList.service.hook';
import { loadRazorpay, RazorpayPaymentResponse } from '@/lib/razorpay';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { BadgePercent, Banknote, Check, CreditCard, Lock, RotateCcw, StickyNote, Truck, UserRound, Wallet } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { Roles } from '@pms/types';

type DiscountMode = 'flat' | 'percent';

const CheckoutSchema = yup.object().shape({
  customerId: yup.string().required('Select a customer'),
  discountMode: yup.mixed<DiscountMode>().oneOf(['flat', 'percent']).required().default('flat'),
  discountValue: yup
    .number()
    .min(0, 'Must be 0 or more')
    .typeError('Must be a number')
    .optional()
    .default(0)
    .when('discountMode', { is: 'percent', then: (s) => s.max(100, 'A percentage cannot exceed 100') }),
  tax: yup.number().min(0, 'Must be 0 or more').typeError('Must be a number').optional().default(0),
  shippingCost: yup.number().min(0, 'Must be 0 or more').typeError('Must be a number').optional().default(0),
  platformFee: yup.number().min(0, 'Must be 0 or more').typeError('Must be a number').optional().default(0),
  notes: yup.string().optional(),
});

type CheckoutFormValues = yup.InferType<typeof CheckoutSchema>;

type PaymentMode = 'razorpay' | 'cash' | 'direct';

const PERCENT_PRESETS = [5, 10, 15, 20];

const round2 = (n: number) => Math.round(n * 100) / 100;

// The API only takes a flat discount amount, so a percentage is turned into money here and
// capped at the subtotal; the server rejects anything larger anyway.
const discountAmountFrom = (mode: DiscountMode, value: number, subtotal: number) => {
  const v = Number(value) || 0;
  const amount = mode === 'percent' ? (subtotal * v) / 100 : v;
  return round2(Math.min(Math.max(0, amount), subtotal));
};

/**
 * The pay step, embedded in the cart page's right column: who the order is for, how the
 * money comes in, and the total that the server recomputes before creating the order.
 * Renders nothing for an empty cart - the cart page owns that state.
 */
export default function CheckoutPanel({ children }: { children?: ReactNode }) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const router = useRouter();
  const pathname = usePathname();

  // /admin and /dashboard are role-gated, so keep navigation inside this area.
  const isDashboard = pathname?.startsWith('/dashboard') ?? false;
  const areaRoot = isDashboard ? '/dashboard' : '/admin';

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('razorpay');
  const [isPaying, setIsPaying] = useState(false);

  const { data: cartResponse, isLoading: isCartLoading } = useGetActiveCart();
  const cart = cartResponse?.data?.data ?? null;
  const items = cart?.items ?? [];

  const { currentUser } = useGetCurrentUser();
  const sessionRole = (currentUser as { role?: string } | undefined)?.role;
  // A signed-in customer IS the customer: no picker, and no fetching the customer directory.
  const isCustomer = sessionRole === Roles.USER;
  const { data: customersResponse } = useGetAllUserList({ role: Roles.USER, showAllRecords: true }, !!sessionRole && !isCustomer);
  const customers = useMemo(
    () =>
      (customersResponse?.data?.data?.data ?? [])
        .map((c: any) => ({
          label: c.name || c.email,
          value: c.userId ?? c.usersId ?? '',
          email: c.email as string | undefined,
          phone: c.phone as string | undefined,
        }))
        .filter((o: any) => o.value),
    [customersResponse]
  );
  const customerOptions = useMemo(() => customers.map(({ label, value }) => ({ label, value })), [customers]);

  const createRazorpayOrderMutation = useCreateRazorpayOrder();
  const verifyPaymentMutation = useVerifyRazorpayPayment();
  const directCheckoutMutation = useCheckoutDirect();

  const form = useForm<CheckoutFormValues>({
    resolver: yupResolver(CheckoutSchema),
    defaultValues: { customerId: '', discountMode: 'flat', discountValue: 0, tax: 0, shippingCost: 0, platformFee: 0, notes: '' },
  });

  const { discountMode, discountValue, tax, shippingCost, platformFee, customerId } = form.watch();
  const selectedCustomer = customers.find((c) => c.value === customerId);

  const self = currentUser as { userId?: string; name?: string; email?: string } | undefined;
  const selfCustomer = isCustomer
    ? { label: self?.name || self?.email || 'Your account', value: self?.userId ?? '', email: self?.email, phone: undefined as string | undefined }
    : undefined;
  const activeCustomer = isCustomer ? selfCustomer : selectedCustomer;

  // The form still carries customerId, so validation and the API payload stay identical.
  useEffect(() => {
    if (isCustomer && self?.userId && form.getValues('customerId') !== self.userId) form.setValue('customerId', self.userId);
  }, [isCustomer, self?.userId, form]);

  // The store's configured charges are the starting point, filled in once when the cart
  // arrives; the operator can still change them before paying.
  const charges = cart?.charges;
  const prefilled = useRef(false);
  const applyStoreCharges = () => {
    if (!charges) return;
    form.setValue('tax', charges.tax);
    form.setValue('platformFee', charges.platformFee);
    form.setValue('shippingCost', charges.shippingCharge);
  };
  useEffect(() => {
    if (!charges || prefilled.current) return;
    prefilled.current = true;
    form.setValue('tax', charges.tax);
    form.setValue('platformFee', charges.platformFee);
    form.setValue('shippingCost', charges.shippingCharge);
  }, [charges, form]);

  // Totals are shown from the cart the server returned; the server recomputes them
  // authoritatively at checkout, so this is display only.
  const subtotal = cart?.totalAmount ?? 0;
  const discountAmount = discountAmountFrom(discountMode, discountValue, subtotal);
  const taxAmount = Number(tax) || 0;
  const shippingAmount = Number(shippingCost) || 0;
  const platformAmount = Number(platformFee) || 0;
  const grandTotal = Math.max(0, round2(subtotal + taxAmount + shippingAmount + platformAmount - discountAmount));
  const chargesTouched =
    taxAmount !== (charges?.tax ?? 0) || shippingAmount !== (charges?.shippingCharge ?? 0) || platformAmount !== (charges?.platformFee ?? 0);

  const currency = cart?.currency ?? 'INR';
  const symbol = currency === 'INR' ? '₹' : currency;
  const money = (value: number) =>
    `${currency === 'INR' ? '₹' : `${currency} `}${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const currencyPrefix = ({ className }: { className?: string }) => (
    <span className={cn(className, 'flex items-center justify-center text-sm font-medium')}>{symbol}</span>
  );
  const percentPrefix = ({ className }: { className?: string }) => (
    <span className={cn(className, 'flex items-center justify-center text-sm font-medium')}>%</span>
  );
  const discountLabel = discountMode === 'percent' && (Number(discountValue) || 0) > 0 ? `Discount (${Number(discountValue)}%)` : 'Discount';

  const isBusy = isPaying || createRazorpayOrderMutation.isPending || verifyPaymentMutation.isPending || directCheckoutMutation.isPending;

  const showError = (response: unknown, title: string) => {
    const message = unitOfService.ErrorHandlerService.getErrorMessage(response as never);
    toast({ variant: 'destructive', title, description: <span>{message}</span> });
  };

  const onCheckoutComplete = (orderId: number, message: string) => {
    toast({ variant: 'success', title: message });
    router.push(`${areaRoot}/orders/${orderId}`);
  };

  const adjustmentsFrom = (data: CheckoutFormValues) => ({
    discount: discountAmountFrom(data.discountMode, data.discountValue, subtotal),
    tax: Number(data.tax) || 0,
    shippingCost: Number(data.shippingCost) || 0,
    platformFee: Number(data.platformFee) || 0,
  });

  const handleDirectCheckout = async (data: CheckoutFormValues) => {
    try {
      const response = await directCheckoutMutation.mutateAsync({
        customerId: data.customerId,
        notes: data.notes || null,
        settlement: paymentMode === 'cash' ? 'cash' : 'credit',
        ...adjustmentsFrom(data),
      });

      if (response && response.status === 201 && response.data?.data) {
        onCheckoutComplete(response.data.data.order.id, 'Order placed successfully');
      } else {
        showError(response, 'Could not place the order');
      }
    } catch (error) {
      showError(error, 'Could not place the order');
    }
  };

  const handleRazorpayCheckout = async (data: CheckoutFormValues) => {
    setIsPaying(true);
    try {
      const Razorpay = await loadRazorpay();

      // The amount is computed by the server from the cart; only the operator's
      // adjustments are sent.
      const orderResponse = await createRazorpayOrderMutation.mutateAsync(adjustmentsFrom(data));
      if (!orderResponse || orderResponse.status !== 201 || !orderResponse.data?.data) {
        showError(orderResponse, 'Could not start the payment');
        setIsPaying(false);
        return;
      }

      const gatewayOrder = orderResponse.data.data;
      const customerLabel = (isCustomer ? selfCustomer?.label : customerOptions.find((o: any) => o.value === data.customerId)?.label) ?? '';

      const checkout = new Razorpay({
        key: gatewayOrder.keyId,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
        order_id: gatewayOrder.orderId,
        name: 'Point of Sale',
        description: `${items.length} product${items.length === 1 ? '' : 's'}`,
        prefill: { name: customerLabel },
        theme: { color: '#2563eb' },

        handler: async (paymentResponse: RazorpayPaymentResponse) => {
          try {
            const verifyResponse = await verifyPaymentMutation.mutateAsync({
              customerId: data.customerId,
              notes: data.notes || null,
              ...adjustmentsFrom(data),
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (verifyResponse && verifyResponse.status === 201 && verifyResponse.data?.data) {
              const result = verifyResponse.data.data;
              onCheckoutComplete(
                result.order.id,
                result.alreadyProcessed ? 'This payment was already recorded' : 'Payment successful and order placed'
              );
            } else {
              // The money may well have been taken, so never imply it was not.
              showError(verifyResponse, 'Payment taken but the order could not be recorded');
            }
          } catch (error) {
            showError(error, 'Payment taken but the order could not be recorded');
          } finally {
            setIsPaying(false);
          }
        },

        modal: {
          ondismiss: () => {
            setIsPaying(false);
            toast({ title: 'Payment cancelled', description: 'Your cart has been left untouched.' });
          },
        },
      });

      checkout.on('payment.failed', (failure) => {
        setIsPaying(false);
        toast({
          variant: 'destructive',
          title: 'Payment failed',
          description: <span>{failure.error?.description || 'The gateway rejected the payment.'}</span>,
        });
      });

      checkout.open();
    } catch (error: any) {
      setIsPaying(false);
      showError(error, 'Could not start the payment');
    }
  };

  const onSubmit = (data: CheckoutFormValues) => (paymentMode === 'razorpay' ? handleRazorpayCheckout(data) : handleDirectCheckout(data));

  if (isCartLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (items.length === 0) {
    return null;
  }

  // Cash is an operator claim that money changed hands, so customers never see it.
  const paymentModes: { id: PaymentMode; title: string; description: string; icon: typeof CreditCard }[] = [
    { id: 'razorpay', title: 'Pay online', description: 'Card, UPI or netbanking via Razorpay', icon: CreditCard },
    ...(!isCustomer
      ? [
          {
            id: 'cash' as PaymentMode,
            title: 'Cash',
            description: 'Money received now - the order is confirmed and recorded as paid',
            icon: Banknote,
          },
        ]
      : []),
    { id: 'direct', title: 'Pay-Later', description: 'On credit - place the order now, settle it later from the order', icon: Wallet },
  ];

  const chargeFields = [
    { name: 'tax', label: charges && charges.taxRate > 0 ? `Tax (${charges.taxRate}%)` : 'Tax' },
    { name: 'platformFee', label: 'Platform fee' },
    { name: 'shippingCost', label: charges?.shippingWaived ? 'Shipping (free above threshold)' : 'Shipping' },
  ] as const;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid items-start gap-5 lg:grid-cols-[1fr_400px]">
        {/* Left: the items (passed in by the cart page) with the optional fields below them. */}
        <div className="min-w-0 space-y-4">
          {children}
          {!isCustomer && (
            <Section
              step={2}
              title="Discount & charges"
              hint="Charges are pre-filled from the store settings; change them here if this order differs."
              icon={BadgePercent}
              done={discountAmount + taxAmount + shippingAmount + platformAmount > 0}
              action={
                charges && chargesTouched ? (
                  <button
                    type="button"
                    onClick={applyStoreCharges}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset charges
                  </button>
                ) : null
              }
            >
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Discount</span>
                  <FormField
                    control={form.control}
                    name="discountMode"
                    render={({ field }) => (
                      <div className="inline-flex rounded-md border bg-background p-0.5 text-xs" role="radiogroup" aria-label="Discount type">
                        {(
                          [
                            { value: 'flat', label: `${symbol} Flat amount` },
                            { value: 'percent', label: '% Percentage' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={field.value === opt.value}
                            onClick={() => {
                              if (field.value === opt.value) return;
                              field.onChange(opt.value);
                              form.setValue('discountValue', 0, { shouldValidate: true });
                            }}
                            className={cn(
                              'rounded px-2.5 py-1 font-medium transition-colors',
                              field.value === opt.value
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-end">
                  <FormField
                    control={form.control}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs">{discountMode === 'percent' ? 'Percent off the subtotal' : 'Amount off'}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={discountMode === 'percent' ? 100 : undefined}
                            step={discountMode === 'percent' ? '1' : '0.01'}
                            inputMode="decimal"
                            icon={discountMode === 'percent' ? percentPrefix : currencyPrefix}
                            className="pl-0 tabular-nums"
                            value={field.value ?? 0}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => field.onChange(e.target.value === '' ? 0 : +e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                    {discountMode === 'percent' ? (
                      PERCENT_PRESETS.map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => form.setValue('discountValue', pct, { shouldValidate: true })}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                            Number(discountValue) === pct
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                          )}
                        >
                          {pct}%
                        </button>
                      ))
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Up to {money(subtotal)}, the cart subtotal.</span>
                    )}
                    {discountAmount > 0 && (
                      <span className="ml-auto text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        −{money(discountAmount)}
                        {discountMode === 'flat' && subtotal > 0 ? ` (${round2((discountAmount / subtotal) * 100)}%)` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {chargeFields.map(({ name, label }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs">{label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            inputMode="decimal"
                            icon={currencyPrefix}
                            className="pl-0 tabular-nums"
                            value={field.value ?? 0}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => field.onChange(e.target.value === '' ? 0 : +e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="mt-3 space-y-1">
                    <FormLabel className="text-xs">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={1}
                        className="min-h-[40px] resize-none"
                        placeholder="Anything to record against this order (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>
          )}

          {isCustomer && (
            <Section step={1} title="Notes" hint="Anything you want recorded against this order." icon={StickyNote} done>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormControl>
                      <Textarea rows={2} className="min-h-[56px] resize-none" placeholder="e.g. Please deliver after 6pm (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>
          )}
        </div>

        {/* Right: who pays and how, with the total. */}
        <div className="min-w-0 space-y-4 lg:sticky lg:top-4">
          {!isCustomer && (
            <Section
              step={1}
              title="Customer"
              hint={isCustomer ? 'This order goes to your account.' : 'Who this order is for.'}
              icon={UserRound}
              done={!!activeCustomer}
            >
              <div className="grid gap-3">
                {!isCustomer && (
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormControl>
                          <div className="flex">
                            <SelectSearch
                              placeholder="Search customer by name or email *"
                              buttonClass="w-full"
                              items={customerOptions}
                              value={field.value}
                              valueType="string"
                              containerName="checkout-customer"
                              onChange={(value) => field.onChange(value)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div
                  className={cn(
                    'flex h-10 items-center gap-2.5 rounded-md border px-2.5',
                    activeCustomer ? 'bg-muted/30' : 'border-dashed text-muted-foreground'
                  )}
                >
                  {activeCustomer ? (
                    <>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {activeCustomer.label.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium leading-tight">
                          {activeCustomer.label}
                          {isCustomer && <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">You</span>}
                        </p>
                        <p className="truncate text-[11px] leading-tight text-muted-foreground">
                          {[activeCustomer.email, activeCustomer.phone].filter(Boolean).join(' · ') || 'No contact details'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs">No customer picked yet</span>
                  )}
                </div>
              </div>
            </Section>
          )}

          <Card className="overflow-hidden border p-0 md:p-0">
            <div className="bg-gradient-to-br from-primary via-primary to-indigo-700 px-5 py-4 text-primary-foreground">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/80">Total due</p>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium tabular-nums text-primary-foreground">
                  {items.length} {items.length === 1 ? 'product' : 'products'} · {cart?.totalQuantity ?? 0} qty
                </span>
              </div>
              <p className="mt-1 text-3xl font-bold tabular-nums leading-none">{money(grandTotal)}</p>
              {discountAmount > 0 && <p className="mt-1.5 text-[11px] text-primary-foreground/80">You are giving {money(discountAmount)} off.</p>}
            </div>

            <div className="p-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">{money(subtotal)}</dd>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <dt>{discountLabel}</dt>
                    <dd className="tabular-nums">−{money(discountAmount)}</dd>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tax{charges && charges.taxRate > 0 ? ` (${charges.taxRate}%)` : ''}</dt>
                    <dd className="tabular-nums">{money(taxAmount)}</dd>
                  </div>
                )}
                {platformAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Platform fee</dt>
                    <dd className="tabular-nums">{money(platformAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" />
                    Shipping
                  </dt>
                  <dd className={cn('tabular-nums', shippingAmount === 0 && 'font-medium text-emerald-600 dark:text-emerald-400')}>
                    {shippingAmount > 0 ? money(shippingAmount) : 'Free'}
                  </dd>
                </div>
              </dl>

              <Separator className="my-4" />

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">To pay</span>
                <span className="text-xl font-bold tabular-nums text-primary">{money(grandTotal)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Recomputed on the server from the cart before the order is created.</p>

              <div className="mt-4">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment method</p>
                <div className="flex w-full rounded-lg border bg-background p-1" role="radiogroup" aria-label="Payment method">
                  {paymentModes.map((mode) => {
                    const Icon = mode.icon;
                    const selected = paymentMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setPaymentMode(mode.id)}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {mode.title}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{paymentModes.find((mode) => mode.id === paymentMode)?.description}</p>
              </div>

              <Button type="submit" size="lg" className="mt-3 w-full gap-2" loading={isBusy} disabled={isBusy}>
                {paymentMode === 'razorpay' ? (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay {money(grandTotal)}
                  </>
                ) : paymentMode === 'cash' ? (
                  <>
                    <Banknote className="h-4 w-4" />
                    Take {money(grandTotal)} in cash
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    Place on Pay-Later
                  </>
                )}
              </Button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                {paymentMode === 'direct'
                  ? 'No payment is recorded; settle the udhari later from the order.'
                  : paymentMode === 'cash'
                    ? 'A paid cash payment is recorded against the order.'
                    : 'Secured by Razorpay. Card, UPI and netbanking.'}
              </p>
            </div>
          </Card>
        </div>
      </form>
    </Form>
  );
}

interface SectionProps {
  step: number;
  title: string;
  hint: string;
  icon: typeof UserRound;
  done?: boolean;
  action?: ReactNode;
  children: ReactNode;
}

// One numbered card per step; the number turns into a tick once the step is satisfied.
function Section({ step, title, hint, icon: Icon, done, action, children }: SectionProps) {
  return (
    <Card className="border p-0 md:p-0">
      <div className="flex items-center gap-3 border-b px-4 py-3 sm:px-5">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            done ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary'
          )}
        >
          {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
        </div>
        {action}
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </Card>
  );
}
