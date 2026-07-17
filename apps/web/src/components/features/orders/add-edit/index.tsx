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
import { useCreateOrder, useGetOrderById, useUpdateOrder } from '@/hooks/service-hooks/useOrderService';
import { CreateOrderModel } from '@/models/order.model';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';

interface ManageOrderProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

const OrderSchema = Yup.object({
  customerId: Yup.string().required('Customer ID is required'),
  discount: Yup.number().required().default(0),
  tax: Yup.number().required().default(0),
  shippingCost: Yup.number().required().default(0),

  status: Yup.mixed<OrderStatus>()
    .oneOf(Object.values(OrderStatus))
    .required(),

  notes: Yup.string().optional(),
});


export default function ManageOrder({ id, isOpen, onClose }: ManageOrderProps) {
  const isEdit = !!id && id > 0;
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const { data: orderResponse, isLoading: isFetching } = useGetOrderById(id ?? 0, isEdit);

  const form = useForm<CreateOrderModel>({
    resolver: yupResolver(OrderSchema),
    defaultValues: {
      customerId: '',
      discount: 0,
      tax: 0,
      shippingCost: 0,
      status: OrderStatus.Pending,
      notes: '',
    },
  });

  const { handleSubmit, reset, setValue } = form;

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
      });
    }
  }, [isEdit, orderResponse, reset]);

  const submitData = async (model: CreateOrderModel) => {
    let response;

    if (isEdit) {
      response = await updateOrder.mutateAsync({ id: id!, model });
    } else {
      response = await createOrder.mutateAsync(model);
    }

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
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer ID *</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shippingCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Cost</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <SelectSearch
                      buttonClass="w-full"
                      placeholder="Select Status"
                      disableSearch={true}
                      items={[
                        { label: 'Pending', value: 'Pending' },
                        { label: 'Processing', value: 'Processing' },
                        { label: 'Completed', value: 'Completed' },
                        { label: 'Cancelled', value: 'Cancelled' },
                        { label: 'Failed', value: 'Failed' },
                      ]}
                      value={field.value ?? ''}
                      onChange={(value) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Order notes" {...field} />
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
