'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { OrderStatus } from '@/enums/order-status.enum';
import { Roles } from '@/enums/roles.enum';
import { useCreateOrder, useGetOrderById, useUpdateOrder } from '@/hooks/service-hooks/useOrderService';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useGetAllUserList } from '@/hooks/service-hooks/useUserList.service.hook';
import { CreateOrderModel } from '@/models/order.model';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as Yup from 'yup';

interface ManageOrderProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

const OrderSchema = Yup.object({
  customerId: Yup.string().required('Customer is required'),
  discount: Yup.number().typeError('Enter a number').min(0).required().default(0),
  tax: Yup.number().typeError('Enter a number').min(0).required().default(0),
  shippingCost: Yup.number().typeError('Enter a number').min(0).required().default(0),
  status: Yup.mixed<OrderStatus>().oneOf(Object.values(OrderStatus)).required(),
  notes: Yup.string().optional(),
  items: Yup.array()
    .of(
      Yup.object({
        productId: Yup.number().typeError('Product is required').required('Product is required'),
        quantity: Yup.number().typeError('Quantity is required').min(1, 'Quantity must be at least 1').required('Quantity is required'),
      })
    )
    .min(1, 'Add at least one product')
    .required(),
});

type OrderFormValues = Yup.InferType<typeof OrderSchema>;

export default function ManageOrder({ id, isOpen, onClose }: ManageOrderProps) {
  const isEdit = !!id && id > 0;
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const { data: orderResponse, isLoading: isFetching } = useGetOrderById(id ?? 0, isEdit);

  // Customers (users with the USER role) and products for the dropdowns.
  const { data: customersResponse } = useGetAllUserList({ role: Roles.USER, showAllRecords: true });
  const customerOptions = useMemo(
    () =>
      (customersResponse?.data?.data?.data || [])
        .map((c) => {
          // API returns the GUID under `userId`; the DTO mislabels it `usersId`.
          const cid = ((c as any).userId ?? (c as any).usersId ?? '') as string;
          return { label: c.email ? `${c.name} (${c.email})` : c.name, value: cid };
        })
        .filter((o) => o.value),
    [customersResponse]
  );

  const { data: productsResponse } = useGetAllProducts();
  const productOptions = useMemo(
    () => (productsResponse?.data?.data?.data || []).map((p) => ({ label: p.name, value: p.id })),
    [productsResponse]
  );

  const form = useForm<OrderFormValues>({
    resolver: yupResolver(OrderSchema),
    defaultValues: {
      customerId: '',
      discount: 0,
      tax: 0,
      shippingCost: 0,
      status: OrderStatus.Pending,
      notes: '',
      items: [{ productId: undefined as any, quantity: 1 }],
    },
  });

  const { control, handleSubmit, reset } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (isEdit && orderResponse?.data?.data) {
      const order = orderResponse.data.data;
      reset({
        customerId: order.customerId,
        discount: order.discount,
        tax: order.tax,
        shippingCost: order.shippingCost,
        status: order.status,
        notes: order.notes ?? '',
        items:
          order.items && order.items.length > 0
            ? order.items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
            : [{ productId: undefined as any, quantity: 1 }],
      });
    }
  }, [isEdit, orderResponse, reset]);

  const submitData = async (model: OrderFormValues) => {
    const payload: CreateOrderModel = {
      customerId: model.customerId,
      discount: model.discount,
      tax: model.tax,
      shippingCost: model.shippingCost,
      status: model.status,
      notes: model.notes,
      items: (model.items ?? []).map((it) => ({ productId: Number(it.productId), quantity: Number(it.quantity) })),
    };

    const response = isEdit ? await updateOrder.mutateAsync({ id: id!, model: payload }) : await createOrder.mutateAsync(payload);

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `Order ${isEdit ? 'updated' : 'created'} successfully` });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = createOrder.isPending || updateOrder.isPending || isFetching;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Order' : 'Add New Order'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <FormControl>
                    <SelectSearch
                      buttonClass="w-full"
                      placeholder="Select a customer"
                      items={customerOptions}
                      value={field.value ?? ''}
                      valueType="string"
                      containerName="order-customer"
                      onChange={(value) => field.onChange(value ? String(value) : '')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <SelectSearch
                      buttonClass="w-full"
                      placeholder="Select Status"
                      disableSearch={true}
                      items={Object.values(OrderStatus).map((s) => ({
                        label: s.charAt(0) + s.slice(1).toLowerCase(),
                        value: s,
                      }))}
                      value={field.value ?? ''}
                      valueType="string"
                      containerName="order-status"
                      onChange={(value) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Products + quantity */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Products *</FormLabel>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  icon={Plus}
                  iconPlacement="left"
                  className="h-auto p-0 text-xs font-medium"
                  onClick={() => append({ productId: undefined as any, quantity: 1 })}
                >
                  Add Product
                </Button>
              </div>

              <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                {fields.map((f, index) => (
                  <div key={f.id} className="flex items-start gap-2">
                    <div className="flex-1">
                      <FormField
                        control={control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <SelectSearch
                                buttonClass="w-full h-10 font-normal"
                                placeholder="Select a product"
                                items={productOptions}
                                value={field.value ?? ''}
                                valueType="number"
                                containerName={`order-product-${index}`}
                                onChange={(value) => field.onChange(value === '' ? undefined : Number(value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-24">
                      <FormField
                        control={control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                className="h-10"
                                placeholder="Qty"
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={`h-10 w-10 shrink-0 text-slate-400 hover:text-red-500 ${fields.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      onClick={() => fields.length > 1 && remove(index)}
                      disabled={fields.length <= 1}
                      title="Remove product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="shippingCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Cost</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Order notes" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                {isEdit ? 'Update' : 'Create'} Order
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
