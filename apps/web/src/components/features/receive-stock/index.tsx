'use client';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useCreatePurchase } from '@/hooks/service-hooks/usePurchaseService';
import { ReceiveStockFormValues, receiveStockSchema } from '@/schema/receiveStockSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import { CheckCircle2, FileText, Package, Plus, Receipt, UploadCloud, X } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { PurchaseItemRow } from './purchase-item-row';

/** A numbered form section with an icon, title and optional description. */
function Section({
  step,
  icon,
  title,
  description,
  aside,
  children,
}: {
  step: number;
  icon: ReactNode;
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="border-0 p-0 shadow-sm ring-1 ring-slate-200">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              {icon}
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {step}
              </span>
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
              {description && <p className="text-xs text-slate-500">{description}</p>}
            </div>
          </div>
          {aside}
        </div>
        <div className="p-5">{children}</div>
      </CardContent>
    </Card>
  );
}

export default function ReceiveStockPage() {
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: productsData } = useGetAllProducts();
  const products = productsData?.data?.data?.data || [];
  const createPurchase = useCreatePurchase();

  const form = useForm<ReceiveStockFormValues>({
    resolver: yupResolver(receiveStockSchema),
    defaultValues: {
      supplierName: '',
      invoiceNumber: '',
      notes: '',
      items: [{ productId: undefined as any, quantity: undefined as any, unitCost: undefined as any }],
      totalAmount: 0,
    },
  });

  const { control, handleSubmit, watch, reset } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items');
  const totalUnits = watchedItems?.reduce((acc, item) => acc + (Number(item?.quantity) || 0), 0) || 0;
  const totalCost =
    watchedItems?.reduce((acc, item) => {
      if (item?.quantity && item?.unitCost) return acc + Number(item.quantity) * Number(item.unitCost);
      return acc;
    }, 0) || 0;

  // An item is "ready" once it has a product, a quantity and a unit cost.
  const readyItems = watchedItems?.filter((item) => item?.productId && Number(item?.quantity) > 0 && item?.unitCost !== undefined).length || 0;
  const hasReadyItem = readyItems > 0;

  const isSubmitting = createPurchase.isPending || isUploading;

  const uploadInvoiceToCloudinary = async (file: File): Promise<string> => {
    try {
      const { data } = await axios.get('/api/images/sign-cloudinary-params');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', data.apikey);
      formData.append('timestamp', data.timestamp);
      formData.append('signature', data.signature);
      formData.append('folder', data.folder);

      const res = await axios.post(`https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`, formData);
      return res.data.secure_url;
    } catch (error) {
      console.error('Upload failed', error);
      throw new Error('Failed to upload invoice');
    }
  };

  const onSubmit = async (data: ReceiveStockFormValues) => {
    try {
      setIsUploading(true);
      let invoiceUrl = '';
      if (invoiceFile) invoiceUrl = await uploadInvoiceToCloudinary(invoiceFile);

      // Map the form's `unitCost` to the API's `costPrice`/`totalPrice` contract.
      const formattedItems = data.items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        costPrice: Number(item.unitCost),
        totalPrice: Number(item.quantity) * Number(item.unitCost),
      }));

      await createPurchase.mutateAsync({
        invoiceNumber: data.invoiceNumber || undefined,
        supplierName: data.supplierName || undefined,
        notes: data.notes || undefined,
        invoiceUrl: invoiceUrl || undefined,
        totalAmount: totalCost,
        items: formattedItems,
      });

      toast({ variant: 'success', title: 'Success', description: 'Stock received successfully!' });
      reset();
      setInvoiceFile(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to receive stock' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-12">
      <PageHeader
        title="Add Stock"
        description="Add incoming products to your inventory and attach supplier invoices for record-keeping."
        variant="back"
      />

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* LEFT — Products */}
          <div className="space-y-5 lg:col-span-3">
            <Section
              step={1}
              icon={<Package className="h-4 w-4" />}
              title="Products"
              description="Pick a product, then enter how many you received and the unit cost."
              aside={
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {fields.length} item{fields.length !== 1 ? 's' : ''}
                </span>
              }
            >
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <PurchaseItemRow
                    key={field.id}
                    control={control}
                    index={index}
                    products={products}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  icon={Plus}
                  iconPlacement="left"
                  className="h-12 w-full border-2 border-dashed text-slate-600 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                  onClick={() =>
                    append({ productId: undefined as any, quantity: undefined as any, unitCost: undefined as any, totalCost: undefined as any })
                  }
                >
                  Add Another Product
                </Button>
              </div>
            </Section>
          </div>

          {/* RIGHT — Details + summary */}
          <div className="space-y-5 lg:col-span-2">
            <div className="sticky top-6 space-y-5">
              <Section step={2} icon={<Receipt className="h-4 w-4" />} title="Supplier & Invoice" description="Optional record-keeping details.">
                <div className="space-y-4">
                  <FormField
                    control={control}
                    name="supplierName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">
                          Supplier Name <span className="font-normal text-slate-400">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Acme Corp" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">
                          Invoice Number <span className="font-normal text-slate-400">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. INV-12345" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel className="text-slate-700">
                      Invoice File <span className="font-normal text-slate-400">(optional)</span>
                    </FormLabel>
                    {!invoiceFile ? (
                      <div
                        className="group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 p-4 transition-all hover:border-primary hover:bg-slate-50"
                        onClick={() => document.getElementById('invoice-upload')?.click()}
                      >
                        <Input id="invoice-upload" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} />
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-primary/10">
                          <UploadCloud className="h-5 w-5 text-slate-500 transition-colors group-hover:text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">Click to upload invoice</p>
                          <p className="text-xs text-slate-500">PDF, JPG, PNG up to 10MB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="rounded-lg bg-white p-2 shadow-sm">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="truncate">
                            <p className="truncate text-sm font-semibold text-slate-800">{invoiceFile.name}</p>
                            <p className="text-xs text-slate-500">{(invoiceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-red-500" onClick={() => setInvoiceFile(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">
                          Notes <span className="font-normal text-slate-400">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea className="resize-none bg-slate-50" rows={2} placeholder="Any additional details..." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              {/* Summary + submit */}
              <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-lg ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Units</span>
                  <span className="text-lg font-bold tabular-nums">{totalUnits}</span>
                </div>
                <div className="my-3 h-px bg-white/10" />
                <div className="flex items-end justify-between">
                  <span className="text-sm font-medium text-slate-300">Total Cost</span>
                  <span className="text-3xl font-black leading-none tabular-nums">${totalCost.toFixed(2)}</span>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  icon={CheckCircle2}
                  iconPlacement="left"
                  loading={isSubmitting}
                  className="mt-5 w-full text-base font-semibold"
                  disabled={isSubmitting || !hasReadyItem}
                >
                  {isSubmitting ? 'Processing...' : 'Complete Receive Stock'}
                </Button>
                <p className="mt-2 text-center text-xs text-slate-400">
                  {hasReadyItem
                    ? `${readyItems} item${readyItems !== 1 ? 's' : ''} ready to receive`
                    : 'Add a product with quantity and unit cost to continue'}
                </p>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
