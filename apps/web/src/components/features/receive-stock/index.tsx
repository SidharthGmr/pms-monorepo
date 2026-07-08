'use client';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useCreatePurchase } from '@/hooks/service-hooks/usePurchaseService';
import { ReceiveStockFormValues, receiveStockSchema } from '@/schema/receiveStockSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import { CheckCircle2, FileText, Plus, UploadCloud, X } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { PurchaseItemRow } from './purchase-item-row';

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
      totalAmount: 0
    }
  });

  const { control, handleSubmit, watch, reset } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');

  const totalCalculatedAmount = watchedItems?.reduce((acc, item) => {
    if (item?.quantity && item?.unitCost) {
      return acc + (Number(item.quantity) * Number(item.unitCost));
    }
    return acc;
  }, 0) || 0;

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
      if (invoiceFile) {
        invoiceUrl = await uploadInvoiceToCloudinary(invoiceFile);
      }

      const formattedItems = data.items.map(item => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        totalCost: Number(item.quantity) * Number(item.unitCost)
      }));

      await createPurchase.mutateAsync({
        invoiceNumber: data.invoiceNumber || undefined,
        supplierName: data.supplierName || undefined,
        notes: data.notes || undefined,
        invoiceUrl: invoiceUrl || undefined,
        totalAmount: totalCalculatedAmount,
        items: formattedItems as any
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
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <PageHeader
        title={`Add Stock (${fields.length} Item${fields.length !== 1 ? 's' : ''})`}
        description="Add incoming products to your inventory and attach supplier invoices for record-keeping."
        actionText="Receive Stock"
        href="/admin/receive-stock"
      />

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Left Column: Products List */}
          <div className="xl:col-span-2 space-y-6">

            <div className="space-y-2">
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
              <div className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  icon={Plus}
                  className="w-full h-12 border-dashed border-2 text-slate-600 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => append({ productId: undefined as any, quantity: undefined as any, unitCost: undefined as any, totalCost: undefined as any })}
                >
                  Add Another Product
                </Button>
              </div>
            </div>



          </div>

          {/* Right Column: Details & Submit */}
          <div className="space-y-6">
            <Card className="border-0 p-0 shadow-md ring-1 ring-slate-200 sticky top-6">
              <CardHeader className="border-b bg-slate-50/50 p-2">
                <CardTitle className="text-xs">Purchase Details</CardTitle>
                <small>Supplier information and invoice.</small>
              </CardHeader>
              <CardContent className="p-2 space-y-2">

                <FormField
                  control={control}
                  name="supplierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name <span className="text-slate-400 font-normal">(Optional)</span></FormLabel>
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
                      <FormLabel>Invoice Number <span className="text-slate-400 font-normal">(Optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. INV-12345" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Invoice File <span className="text-slate-400 font-normal">(Optional)</span></FormLabel>
                  {!invoiceFile ? (
                    <div
                      className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 hover:border-primary transition-all group"
                      onClick={() => document.getElementById('invoice-upload')?.click()}
                    >
                      <Input
                        id="invoice-upload"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                      />
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                        <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm text-slate-700 font-medium mb-1">Click to upload invoice</p>
                      <p className="text-xs text-slate-500">PDF, JPG, PNG up to 10MB</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-semibold text-slate-800 truncate">{invoiceFile.name}</p>
                          <p className="text-xs text-slate-500">{(invoiceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 shrink-0" onClick={() => setInvoiceFile(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <FormField
                  control={control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes <span className="text-slate-400 font-normal">(Optional)</span></FormLabel>
                      <FormControl>
                        <Textarea className="bg-slate-50 resize-none" rows={3} placeholder="Any additional details..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-6 border-t border-slate-200">
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-slate-500 font-semibold">Total Est. Cost</span>
                    <span className="text-3xl font-black text-slate-800">${totalCalculatedAmount.toFixed(2)}</span>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-base font-semibold shadow-md hover:shadow-lg transition-all"
                    disabled={createPurchase.isPending || isUploading || fields.length === 0}
                  >
                    {createPurchase.isPending || isUploading ? (
                      'Processing...'
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" /> Complete Receive Stock
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
