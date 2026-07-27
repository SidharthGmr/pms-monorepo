'use client';

import { SelectSearch } from '@/components/common/select-search';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
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
import { CreditCard, Package, ShoppingCart, Wallet } from 'lucide-react';
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
  const customerOptions = useMemo(
    () =>
      (customersResponse?.data?.data?.data ?? [])
        .map((c: any) => ({ label: c.name || c.email, value: c.userId ?? c.usersId ?? '' }))
        .filter((o: any) => o.value),
    [customersResponse]
  );

  const createRazorpayOrderMutation = useCreateRazorpayOrder();
  const verifyPaymentMutation = useVerifyRazorpayPayment();
  const directCheckoutMutation = useCheckoutDirect();

  const form = useForm<CheckoutFormValues>({
    resolver: yupResolver(CheckoutSchema),
    defaultValues: { customerId: '', discount: 0, tax: 0, shippingCost: 0, notes: '' },
  });

  const { discount, tax, shippingCost } = form.watch();

  // Totals are shown from the cart the server returned; the server recomputes them
  // authoritatively at checkout, so this is display only.
  const subtotal = cart?.totalAmount ?? 0;
  const grandTotal = Math.max(0, subtotal + (Number(tax) || 0) + (Number(shippingCost) || 0) - (Number(discount) || 0));
  const currency = cart?.currency ?? 'INR';
  const money = (value: number) => `${currency} ${value.toFixed(2)}`;

  const isBusy =
    isPaying || createRazorpayOrderMutation.isPending || verifyPaymentMutation.isPending || directCheckoutMutation.isPending;

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

  if (isCartLoading) {
    return (
      <div className="grid gap-5">
        <PageHeader title="Checkout" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="grid gap-5">
        <PageHeader title="Checkout" />
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <ShoppingCart className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Nothing to check out</p>
            <p className="text-xs text-muted-foreground">Add products to your cart first.</p>
          </div>
          <Button asChild size="sm" className="mt-2">
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
    <div className="grid gap-5">
      <PageHeader title="Checkout" description="Review the order and take payment" actionText="Back to cart" href={`${areaRoot}/cart`} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 lg:grid-cols-[1fr_360px]">
          {/* Left: customer, adjustments, payment mode */}
          <div className="space-y-5">
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-bold">Customer</h3>
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Customer <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex">
                        <SelectSearch
                          placeholder="Select a customer"
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
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 text-sm font-bold">Adjustments</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {(['discount', 'tax', 'shippingCost'] as const).map((name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{name === 'shippingCost' ? 'Shipping' : name === 'tax' ? 'Tax' : 'Discount'}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={field.value ?? 0}
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
                  <FormItem className="mt-4">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Anything to record against this order (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 text-sm font-bold">Payment method</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentModes.map((mode) => {
                  const Icon = mode.icon;
                  const selected = paymentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMode(mode.id)}
                      aria-pressed={selected}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                        selected ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-border hover:border-primary/40'
                      )}
                    >
                      <div className={cn('rounded-lg p-2', selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{mode.title}</p>
                        <p className="text-xs text-muted-foreground">{mode.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right: order summary */}
          <Card className="h-fit p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">Order summary</h3>
              <Badge variant="blue">{cart?.totalQuantity ?? 0} qty</Badge>
            </div>

            <Separator className="mb-3" />

            <ul className="mb-3 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
                    {item.productImages?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.productImages[0]} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{item.productName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.quantity} × {money(item.unitPrice ?? 0)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums">{money(item.lineTotal ?? 0)}</span>
                </li>
              ))}
            </ul>

            <Separator className="mb-3" />

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="tabular-nums">-{money(Number(discount) || 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tax</dt>
                <dd className="tabular-nums">{money(Number(tax) || 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">{money(Number(shippingCost) || 0)}</dd>
              </div>
            </dl>

            <Separator className="my-3" />

            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-xl font-bold text-primary tabular-nums">{money(grandTotal)}</span>
            </div>

            <Button type="submit" className="mt-4 w-full" loading={isBusy} disabled={isBusy}>
              {paymentMode === 'direct' ? 'Place order' : `Pay ${money(grandTotal)}`}
            </Button>

            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {paymentMode === 'direct'
                ? 'The order is created with no payment recorded, same as the POS screen.'
                : 'The final amount is confirmed by the server before payment.'}
            </p>
          </Card>
        </form>
      </Form>
    </div>
  );
}
