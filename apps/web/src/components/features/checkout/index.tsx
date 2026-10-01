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
import { ArrowLeft, Check, ClipboardList, CreditCard, Lock, Package, ShoppingCart, UserRound, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

const CheckoutSchema = yup.object().shape({
  customerId: yup.string().required('Select a customer'),
  discount: yup.number().min(0, 'Must be >= 0').typeError('Must be a number').optional().default(0),
  tax: yup.number().min(0, 'Must be >= 0').typeError('Must be a number').optional().default(0),
  shippingCost: yup.number().min(0, 'Must be >= 0').typeError('Must be a number').optional().default(0),
  notes: yup.string().optional(),
});

type CheckoutFormValues = yup.InferType<typeof CheckoutSchema>;

type PaymentMode = 'razorpay' | 'direct';

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
    defaultValues: { customerId: '', discount: 0, tax: 0, shippingCost: 0, notes: '' },
  });

  const { discount, tax, shippingCost, customerId } = form.watch();
  const selectedCustomer = customers.find((c) => c.value === customerId);

  // Totals are shown from the cart the server returned; the server recomputes them
  // authoritatively at checkout, so this is display only.
  const subtotal = cart?.totalAmount ?? 0;
  const grandTotal = Math.max(0, subtotal + (Number(tax) || 0) + (Number(shippingCost) || 0) - (Number(discount) || 0));
  const currency = cart?.currency ?? 'INR';
  const money = (value: number) =>
    `${currency === 'INR' ? '₹' : `${currency} `}${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const currencyPrefix = ({ className }: { className?: string }) => (
    <span className={cn(className, 'flex items-center justify-center text-sm font-medium')}>{currency === 'INR' ? '₹' : currency}</span>
  );
  const discountPercent = subtotal > 0 ? Math.round(((Number(discount) || 0) / subtotal) * 100) : 0;

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
    discount: Number(data.discount) || 0,
    tax: Number(data.tax) || 0,
    shippingCost: Number(data.shippingCost) || 0,
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

  const onSubmit = (data: CheckoutFormValues) => (paymentMode === 'direct' ? handleDirectCheckout(data) : handleRazorpayCheckout(data));

  const header = (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Checkout</h1>
            <p className="text-sm text-muted-foreground">Pick the customer, confirm the amounts, take payment.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Steps current={1} />
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`${areaRoot}/cart`}>
              <ArrowLeft className="h-4 w-4" />
              Cart
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );

  if (isCartLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        {header}
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-36 w-full rounded-lg" />
          </div>
          <Skeleton className="h-96 w-full rounded-lg" />
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
            <p className="text-base font-semibold">Nothing to check out</p>
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
    { id: 'direct', title: 'Direct - no payment', description: 'Place the order now and settle later', icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {header}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid items-start gap-5 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <Section
              step={1}
              title="Order details"
              hint="Who it is for, any adjustments, and how they pay."
              icon={UserRound}
              done={!!selectedCustomer && !!paymentMode}
            >
              <Group title="Customer" hint="Who this order is for." done={!!selectedCustomer}>
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
                  <div
                    className={cn(
                      'flex h-10 items-center gap-2.5 rounded-md border px-2.5',
                      selectedCustomer ? 'bg-muted/30' : 'border-dashed text-muted-foreground'
                    )}
                  >
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
              </Group>

              <Group
                title="Adjustments"
                hint="Optional. Applied on top of the cart subtotal."
                done={(Number(discount) || 0) + (Number(tax) || 0) + (Number(shippingCost) || 0) > 0}
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      { name: 'discount', label: 'Discount' },
                      { name: 'tax', label: 'Tax' },
                      { name: 'shippingCost', label: 'Shipping' },
                    ] as const
                  ).map(({ name, label }) => (
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
              </Group>

              <Group title="Payment method" hint="How the money comes in." done>
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
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                            selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          )}
                        >
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
              </Group>
            </Section>
          </div>

          <Card className="lg:sticky lg:top-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">Order summary</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {items.length} {items.length === 1 ? 'product' : 'products'} · {cart?.totalQuantity ?? 0} qty
              </span>
            </div>

            <ul className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
                    {item.productImages?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.productImages[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground/40" />
                    )}
                    <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold tabular-nums text-primary-foreground">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{item.productName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.variantName && item.variantName !== item.productName ? `${item.variantName} · ` : ''}
                      {money(item.unitPrice ?? 0)} each
                    </p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums">{money(item.lineTotal ?? 0)}</span>
                </li>
              ))}
            </ul>

            <Separator className="my-3" />

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{money(subtotal)}</dd>
              </div>
              {(Number(discount) || 0) > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>Discount{discountPercent > 0 ? ` (${discountPercent}%)` : ''}</dt>
                  <dd className="tabular-nums">−{money(Number(discount) || 0)}</dd>
                </div>
              )}
              {(Number(tax) || 0) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="tabular-nums">{money(Number(tax) || 0)}</dd>
                </div>
              )}
              {(Number(shippingCost) || 0) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="tabular-nums">{money(Number(shippingCost) || 0)}</dd>
                </div>
              )}
            </dl>

            <Separator className="my-3" />

            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Total due</span>
              <span className="text-2xl font-bold tabular-nums text-primary">{money(grandTotal)}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">The server recomputes this from the cart before the order is created.</p>

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
              {paymentMode === 'direct'
                ? 'No payment is recorded; settle it later from the order.'
                : 'Secured by Razorpay. Card, UPI and netbanking.'}
            </p>
          </Card>
        </form>
      </Form>
    </div>
  );
}

const STEPS = ['Cart', 'Checkout', 'Order'];

// Three-dot progress so the operator sees where checkout sits between the cart and the finished order.
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
                state === 'done' && 'bg-green-500 text-white',
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

interface GroupProps {
  title: string;
  hint: string;
  done?: boolean;
  children: React.ReactNode;
}

// A labelled block inside the order-details card: small caps title, one-line hint, a tick once it is filled in.
function Group({ title, hint, done, children }: GroupProps) {
  return (
    <div className="border-t pt-3 first:border-t-0 first:pt-0 [&+&]:mt-3">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
            done ? 'bg-green-500 text-white' : 'border border-input bg-background'
          )}
          aria-hidden
        >
          {done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">{title}</h3>
        <span className="truncate text-[11px] text-muted-foreground">· {hint}</span>
      </div>
      {children}
    </div>
  );
}

interface SectionProps {
  step: number;
  title: string;
  hint: string;
  icon: typeof UserRound;
  done?: boolean;
  children: React.ReactNode;
}

function Section({ step, title, hint, icon: Icon, done, children }: SectionProps) {
  return (
    <Card className="border p-0 md:p-0">
      <div className="flex items-center gap-3 border-b px-5 py-3.5">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            done ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
          )}
        >
          {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
      </div>
      <div className="px-5 py-3">{children}</div>
    </Card>
  );
}
