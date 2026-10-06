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
import { Roles } from '@/enums/roles.enum';
import { useGetActiveCart } from '@/hooks/service-hooks/useCartService';
import { useCheckoutDirect, useCreateRazorpayOrder, useVerifyRazorpayPayment } from '@/hooks/service-hooks/useCheckoutService';
import { useGetAllUserList } from '@/hooks/service-hooks/useUserList.service.hook';
import { loadRazorpay, RazorpayPaymentResponse } from '@/lib/razorpay';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { ArrowLeft, BadgePercent, Check, CreditCard, Lock, Receipt, RotateCcw, ShoppingCart, Truck, UserRound, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

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

type PaymentMode = 'razorpay' | 'direct';

const PERCENT_PRESETS = [5, 10, 15, 20];

const round2 = (n: number) => Math.round(n * 100) / 100;

// The API only takes a flat discount amount, so a percentage is turned into money here and
// capped at the subtotal; the server rejects anything larger anyway.
const discountAmountFrom = (mode: DiscountMode, value: number, subtotal: number) => {
  const v = Number(value) || 0;
  const amount = mode === 'percent' ? (subtotal * v) / 100 : v;
  return round2(Math.min(Math.max(0, amount), subtotal));
};

export default function CheckoutPage() {
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

  const { data: customersResponse } = useGetAllUserList({ role: Roles.USER, showAllRecords: true });
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
  const chargesTouched = taxAmount !== (charges?.tax ?? 0) || shippingAmount !== (charges?.shippingCharge ?? 0) || platformAmount !== (charges?.platformFee ?? 0);

  const currency = cart?.currency ?? 'INR';
  const symbol = currency === 'INR' ? '₹' : currency;
  const money = (value: number) => `${currency === 'INR' ? '₹' : `${currency} `}${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const currencyPrefix = ({ className }: { className?: string }) => <span className={cn(className, 'flex items-center justify-center text-sm font-medium')}>{symbol}</span>;
  const percentPrefix = ({ className }: { className?: string }) => <span className={cn(className, 'flex items-center justify-center text-sm font-medium')}>%</span>;
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
      const customerLabel = customerOptions.find((o: any) => o.value === data.customerId)?.label ?? '';

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
              onCheckoutComplete(result.order.id, result.alreadyProcessed ? 'This payment was already recorded' : 'Payment successful and order placed');
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

  const onSubmit = (data: CheckoutFormValues) => (paymentMode === 'direct' ? handleDirectCheckout(data) : handleRazorpayCheckout(data));

  const header = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Receipt className="h-3.5 w-3.5" />
          Step 2 of 3
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick the customer, confirm the charges, take payment.</p>
      </div>
      <div className="flex items-center gap-3">
        <Steps current={1} />
        <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
          <Link href={`${areaRoot}/cart`}>
            <ArrowLeft className="h-4 w-4" />
            Back to cart
          </Link>
        </Button>
      </div>
    </div>
  );

  if (isCartLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        {header}
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        {header}
        <Card className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" aria-hidden />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
              <ShoppingCart className="h-9 w-9" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold">Nothing to pay for</p>
            <p className="max-w-sm text-sm text-muted-foreground">Your cart is empty. Add products first and come back here to take payment.</p>
          </div>
          <Button asChild className="mt-1">
            <Link href={`${areaRoot}/purchase/`}>Browse products</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const paymentModes: { id: PaymentMode; title: string; description: string; icon: typeof CreditCard }[] = [
    { id: 'razorpay', title: 'Pay online', description: 'Card, UPI or netbanking via Razorpay', icon: CreditCard },
    { id: 'direct', title: 'Pay later', description: 'Place the order now and settle it from the order', icon: Wallet },
  ];

  const chargeFields = [
    { name: 'tax', label: charges && charges.taxRate > 0 ? `Tax (${charges.taxRate}%)` : 'Tax' },
    { name: 'platformFee', label: 'Platform fee' },
    { name: 'shippingCost', label: charges?.shippingWaived ? 'Shipping (free above threshold)' : 'Shipping' },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {header}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid items-start gap-5 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-4">
            <Section step={1} title="Customer" hint="Who this order is for." icon={UserRound} done={!!selectedCustomer}>
              <div className="grid gap-3 sm:grid-cols-[1fr_minmax(0,260px)]">
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
                <div className={cn('flex h-10 items-center gap-2.5 rounded-md border px-2.5', selectedCustomer ? 'bg-muted/30' : 'border-dashed text-muted-foreground')}>
                  {selectedCustomer ? (
                    <>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {selectedCustomer.label.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium leading-tight">{selectedCustomer.label}</p>
                        <p className="truncate text-[11px] leading-tight text-muted-foreground">
                          {[selectedCustomer.email, selectedCustomer.phone].filter(Boolean).join(' · ') || 'No contact details'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs">No customer picked yet</span>
                  )}
                </div>
              </div>
            </Section>

            <Section
              step={2}
              title="Discount & charges"
              hint="Charges are pre-filled from the store settings; change them here if this order differs."
              icon={BadgePercent}
              done={discountAmount + taxAmount + shippingAmount + platformAmount > 0}
              action={
                charges && chargesTouched ? (
                  <button type="button" onClick={applyStoreCharges} className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
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
                            className={cn('rounded px-2.5 py-1 font-medium transition-colors', field.value === opt.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
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
                            Number(discountValue) === pct ? 'border-primary bg-primary/10 text-primary' : 'bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
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
                      <Textarea rows={1} className="min-h-[40px] resize-none" placeholder="Anything to record against this order (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <Section step={3} title="Payment method" hint="How the money comes in." icon={CreditCard} done>
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
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
                        'group relative flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-all duration-150',
                        'hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        selected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-input hover:border-muted-foreground/40'
                      )}
                    >
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors', selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 pr-5">
                        <span className="block text-sm font-semibold leading-tight">{mode.title}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{mode.description}</span>
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          'absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white transition-all duration-150',
                          selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                        )}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </Section>
          </div>

          <Card className="overflow-hidden border p-0 md:p-0 lg:sticky lg:top-[72px]">
            <div className="bg-gradient-to-br from-primary via-primary to-indigo-700 px-5 py-4 text-primary-foreground">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/80">Total due</p>
                <Link href={`${areaRoot}/cart`} className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium tabular-nums text-primary-foreground hover:bg-white/25">
                  {items.length} {items.length === 1 ? 'product' : 'products'} · {cart?.totalQuantity ?? 0} qty
                </Link>
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
                  <dd className={cn('tabular-nums', shippingAmount === 0 && 'font-medium text-emerald-600 dark:text-emerald-400')}>{shippingAmount > 0 ? money(shippingAmount) : 'Free'}</dd>
                </div>
              </dl>

              <Separator className="my-4" />

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">To pay</span>
                <span className="text-xl font-bold tabular-nums text-primary">{money(grandTotal)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Recomputed on the server from the cart before the order is created.</p>

              <Button type="submit" size="lg" className="mt-4 w-full gap-2" loading={isBusy} disabled={isBusy}>
                {paymentMode === 'direct' ? (
                  <>
                    <Wallet className="h-4 w-4" />
                    Place order
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay {money(grandTotal)}
                  </>
                )}
              </Button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                {paymentMode === 'direct' ? 'No payment is recorded; settle it later from the order.' : 'Secured by Razorpay. Card, UPI and netbanking.'}
              </p>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}

const STEPS = ['Cart', 'Payment', 'Order'];

// Three-dot progress so the operator sees where payment sits between the cart and the finished order.
function Steps({ current }: { current: number }) {
  return (
    <ol className="hidden items-center gap-2 text-[11px] font-medium text-muted-foreground md:flex" aria-label="Progress">
      {STEPS.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                state === 'done' && 'bg-emerald-500 text-white',
                state === 'current' && 'bg-primary text-primary-foreground',
                state === 'todo' && 'border bg-background text-muted-foreground'
              )}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {state === 'done' ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn(state === 'current' && 'text-foreground')}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px w-5 bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
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
        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', done ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary')}>
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
