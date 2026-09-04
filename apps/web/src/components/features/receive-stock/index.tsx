'use client';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useCreatePurchase } from '@/hooks/service-hooks/usePurchaseService';
import { useGetAllSuppliers } from '@/hooks/service-hooks/useSupplierService';
import { ReceiveStockFormValues, receiveStockSchema } from '@/schema/receiveStockSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import { CheckCircle2, FileText, Package, Plus, Receipt, RotateCcw, UploadCloud, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import ConfirmBox from '@/components/common/confirm-box';
import { useFieldArray, useForm } from 'react-hook-form';
import { PurchaseItemRow, PurchaseItemsHeader } from './purchase-item-row';
import SectionCard from '@/components/common/custome-card';
import { SelectSearch } from '@/components/common/select-search';
import ManageSupplier from '@/components/features/suppliers/add-edit';
import { StatusEnum } from '@pms/types';


export default function ReceiveStockPage() {
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { data: productsData } = useGetAllProducts();
  const products = productsData?.data?.data?.data || [];

  const { data: suppliersData } = useGetAllSuppliers({ showAllRecords: true, status: StatusEnum.Published });
  const suppliers = suppliersData?.data?.data?.data || [];
  const supplierItems = useMemo(() => suppliers.map((s) => ({ label: s.name, value: String(s.id) })), [suppliers]);

  const createPurchase = useCreatePurchase();

  const form = useForm<ReceiveStockFormValues>({
    resolver: yupResolver(receiveStockSchema),
    defaultValues: {
      supplierId: '',
      supplierName: '',
      invoiceNumber: '',
      notes: '',
      items: [{ productId: undefined, variantId: undefined, quantity: undefined, costPrice: undefined }],
      totalAmount: 0,
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  /**
   * Clears the form back to a single blank line. The file input's `value` has to be
   * cleared by hand — otherwise re-picking the same invoice fires no change event.
   */
  const resetForm = useCallback(() => {
    reset();
    setInvoiceFile(null);
    const fileInput = document.getElementById('invoice-upload') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  }, [reset]);

  const watchedItems = watch('items');
  const totalUnits = watchedItems?.reduce((acc, item) => acc + (Number(item?.quantity) || 0), 0) || 0;
  const totalCost =
    watchedItems?.reduce((acc, item) => {
      if (item?.quantity && item?.costPrice) return acc + Number(item.quantity) * Number(item.costPrice);
      return acc;
    }, 0) || 0;

  // An item is "ready" once it names a variant and has a quantity and a unit cost. The
  // product on the line is only the filter that found the variant.
  const readyItems = watchedItems?.filter((item) => item?.variantId && Number(item?.quantity) > 0 && item?.costPrice !== undefined).length || 0;
  const hasReadyItem = readyItems > 0;

  const isSubmitting = createPurchase.isPending || isUploading;

  // Nothing to reset on an untouched form; the attached file and extra lines count
  // as input too, since neither shows up in RHF's `isDirty`.
  const hasUnsavedInput = isDirty || Boolean(invoiceFile) || fields.length > 1;

  const uploadInvoiceToCloudinary = async (file: File): Promise<string> => {
    try {
      // The signing route fixes folder + timestamp server-side; send exactly those
      // (plus file and api_key) or Cloudinary rejects the signature.
      const { data: signed } = await axios.get<{ data: { apiKey: string; cloudName: string; timestamp: number; folder: string; signature: string } }>(
        '/api/images/sign-cloudinary-params',
      );
      const { apiKey, cloudName, timestamp, folder, signature } = signed.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', folder);

      const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, formData);
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

      // Stock lands on a SKU, so only the variant travels; the API derives the product
      // from it. `unitCost` maps to the API's `costPrice`/`totalPrice` contract.
      const formattedItems = data.items.map((item) => ({
        variantId: Number(item.variantId),
        quantity: Number(item.quantity),
        costPrice: Number(item.costPrice),
        totalPrice: Number(item.quantity) * Number(item.costPrice),
      }));

      const selectedSupplier = suppliers.find((s) => String(s.id) === String(data.supplierId));

      await createPurchase.mutateAsync({
        invoiceNumber: data.invoiceNumber || undefined,
        supplierId: data.supplierId || undefined,
        supplierName: selectedSupplier?.name || undefined,
        notes: data.notes || undefined,
        invoiceUrl: invoiceUrl || undefined,
        totalAmount: totalCost,
        items: formattedItems,
      });

      toast({ variant: 'success', title: 'Success', description: 'Stock received successfully!' });
      resetForm();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to receive stock' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-12">
      <PageHeader
        title="Add Stock"
        description="Receive incoming stock against a variant - pick the product to narrow the list, then the SKU - and attach the supplier invoice."
        variant="back"
      />

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 lg:grid-cols-6">
          <div className="space-y-5 lg:col-span-4">
            <SectionCard
              title="Variants to receive"
              icon={Package}
              showScroll={false}
              cta={{
                label: `${fields.length} item${fields.length !== 1 ? 's' : ''}`,
                icon: 'none',
                variant: 'ghost',
                className: 'pointer-events-none px-2 py-0.5 text-xs text-slate-500',
              }}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        {/* <FormLabel>Supplier*</FormLabel> */}
                        <FormControl>
                          <SelectSearch
                            placeholder="Select a supplier*"
                            buttonClass="w-full justify-between truncate px-3 text-left font-normal"
                            items={supplierItems}
                            value={field.value || ''}
                            valueType="string"
                            containerName="receive-stock-supplier"
                            onChange={(value) => field.onChange(value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="place-content-center">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      icon={Plus}
                      iconPlacement="left"
                      className="h-auto p-0 text-xs font-medium"
                      onClick={() => setShowAddSupplier(true)}
                    >
                      Add New Supplier
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <PurchaseItemsHeader />

                  <div className="divide-y divide-slate-100 bg-white">
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
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={Plus}
                      iconPlacement="left"
                      className="h-8 px-2 font-medium text-primary hover:bg-primary/5 hover:text-primary"
                      onClick={() =>
                        append({
                          productId: undefined as any,
                          variantId: undefined as any,
                          quantity: undefined as any,
                          costPrice: undefined as any,
                          totalCost: undefined as any,
                        })
                      }
                    >
                      Add another variant
                    </Button>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">Items total</span>
                      <span className="font-semibold tabular-nums text-slate-900">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
          <div className="space-y-5 lg:col-span-2">
            <div className="sticky top-6 space-y-5">
              <SectionCard title="Invoice" icon={Receipt} href="/admin/stock-purchase/history/" ctaTitle="View All Invoice">
                <div className="space-y-4">
                  <FormField
                    control={control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. INV-12345" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Invoice File</FormLabel>
                    {!invoiceFile ? (
                      <div
                        className="group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 p-4 transition-all hover:border-primary hover:bg-slate-50"
                        onClick={() => document.getElementById('invoice-upload')?.click()}
                      >
                        <Input
                          id="invoice-upload"
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                        />
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-slate-400 hover:text-red-500"
                          onClick={() => setInvoiceFile(null)}
                        >
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
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            className="resize-none bg-slate-50"
                            rows={2}
                            placeholder="Any additional details..."
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </SectionCard>

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
                  //disabled={isSubmitting || !hasReadyItem}
                >
                  {isSubmitting ? 'Processing...' : 'Complete Receive Stock'}
                </Button>
                <p className="mt-2 text-center text-xs text-slate-400">
                  {hasReadyItem
                    ? `${readyItems} item${readyItems !== 1 ? 's' : ''} ready to receive`
                    : 'Pick a product, then its variant, and add quantity and unit cost'}
                </p>

                <div className="mt-4 border-t border-white/10 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={RotateCcw}
                    iconPlacement="left"
                    className="w-full text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40"
                    disabled={isSubmitting || !hasUnsavedInput}
                    onClick={() => setShowResetConfirm(true)}
                  >
                    Reset form
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>

      {showAddSupplier && <ManageSupplier isOpen={showAddSupplier} onClose={() => setShowAddSupplier(false)} required={false} />}

      <ConfirmBox
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onSubmit={() => {
          resetForm();
          setShowResetConfirm(false);
          toast({ variant: 'success', title: 'Form reset', description: 'All entered details have been cleared.' });
        }}
        heading="Reset this form?"
        bodyText="The supplier, every product line and the invoice details will be cleared. This can't be undone."
        yesButtonText="Reset form"
        noButtonText="Keep editing"
        variant="danger"
      />
    </div>
  );
}
