'use client';
import { DragEvent, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { yupResolver } from '@hookform/resolvers/yup';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  FileText,
  History,
  ImageIcon,
  Package,
  PackagePlus,
  Plus,
  Receipt,
  RotateCcw,
  Truck,
  UploadCloud,
  X,
} from 'lucide-react';
import { StatusEnum } from '@pms/types';
import ConfirmBox from '@/components/common/confirm-box';
import { SelectSearch } from '@/components/common/select-search';
import ManageSupplier from '@/components/features/suppliers/add-edit';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useGetAllProducts } from '@/hooks/service-hooks/useProductService';
import { useCreatePurchase } from '@/hooks/service-hooks/usePurchaseService';
import { useGetAllSuppliers } from '@/hooks/service-hooks/useSupplierService';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { ReceiveStockFormValues, receiveStockSchema } from '@/schema/receiveStockSchema';
import { PurchaseItemRow, PurchaseItemsHeader } from './purchase-item-row';

const INVOICE_MAX_MB = 10;
const INVOICE_TYPES = ['application/pdf', 'image/'];

// `p-0` alone loses to the Card's own `md:p-5` in tailwind-merge (different variant).
const FLUSH_CARD = 'p-0 md:p-0';

const blankLine = () => ({
  productId: undefined as unknown as number,
  variantId: undefined as unknown as number,
  quantity: undefined as unknown as number,
  costPrice: undefined as unknown as number,
  totalCost: undefined as unknown as number,
});

export default function ReceiveStockPage() {
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const { data: productsData } = useGetAllProducts({ showAllRecords: true, status: StatusEnum.Published });
  const products = productsData?.data?.data?.data || [];

  const { data: suppliersData } = useGetAllSuppliers({ showAllRecords: true, status: StatusEnum.Published });
  const suppliers = useMemo(() => suppliersData?.data?.data?.data ?? [], [suppliersData]);
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

  // The file input's `value` has to be cleared by hand, otherwise re-picking the same invoice fires no change event.
  const clearInvoice = useCallback(() => {
    setInvoiceFile(null);
    setInvoicePreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    const fileInput = document.getElementById('invoice-upload') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  }, []);

  const resetForm = useCallback(() => {
    reset();
    clearInvoice();
  }, [reset, clearInvoice]);

  // Same checks whether the file arrives from the picker or a drop.
  const acceptInvoice = (file: File | undefined) => {
    if (!file) return;
    if (!INVOICE_TYPES.some((type) => file.type.startsWith(type))) {
      toast({ variant: 'destructive', title: 'Unsupported file', description: 'Attach a PDF or an image of the invoice.' });
      return;
    }
    if (file.size > INVOICE_MAX_MB * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: `Invoices must be ${INVOICE_MAX_MB}MB or smaller.` });
      return;
    }
    setInvoiceFile(file);
    setInvoicePreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    acceptInvoice(e.dataTransfer.files?.[0]);
  };

  const watchedItems = watch('items');
  const supplierId = watch('supplierId');
  const notes = watch('notes');
  const selectedSupplier = suppliers.find((s) => String(s.id) === String(supplierId));
  const totalUnits = watchedItems?.reduce((acc, item) => acc + (Number(item?.quantity) || 0), 0) || 0;
  const totalCost =
    watchedItems?.reduce((acc, item) => {
      if (item?.quantity && item?.costPrice) return acc + Number(item.quantity) * Number(item.costPrice);
      return acc;
    }, 0) || 0;

  // A line is "ready" once it names a variant and has a quantity and a unit cost.
  const readyItems = watchedItems?.filter((item) => item?.variantId && Number(item?.quantity) > 0 && item?.costPrice !== undefined).length || 0;
  const hasReadyItem = readyItems > 0;
  const readyPercent = fields.length > 0 ? Math.round((readyItems / fields.length) * 100) : 0;

  const isSubmitting = createPurchase.isPending || isUploading;
  const hasUnsavedInput = isDirty || Boolean(invoiceFile) || fields.length > 1;

  const uploadInvoiceToCloudinary = async (file: File): Promise<string> => {
    try {
      const { data: signed } = await axios.get<{ data: { apiKey: string; cloudName: string; timestamp: number; folder: string; signature: string } }>(
        '/api/images/sign-cloudinary-params'
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

  // Stock lands on a SKU, so only the variant travels; the API derives the product from it.
  const onSubmit = async (data: ReceiveStockFormValues) => {
    try {
      setIsUploading(true);
      let invoiceUrl = '';
      if (invoiceFile) invoiceUrl = await uploadInvoiceToCloudinary(invoiceFile);

      const formattedItems = data.items.map((item) => ({
        variantId: Number(item.variantId),
        quantity: Number(item.quantity),
        costPrice: Number(item.costPrice),
        totalPrice: Number(item.quantity) * Number(item.costPrice),
      }));

      const supplier = suppliers.find((s) => String(s.id) === String(data.supplierId));

      await createPurchase.mutateAsync({
        invoiceNumber: data.invoiceNumber || undefined,
        supplierId: data.supplierId || undefined,
        supplierName: supplier?.name || undefined,
        notes: data.notes || undefined,
        invoiceUrl: invoiceUrl || undefined,
        totalAmount: totalCost,
        items: formattedItems,
      });

      toast({
        variant: 'success',
        title: 'Stock received',
        description: `${totalUnits} units across ${readyItems} ${readyItems === 1 ? 'line' : 'lines'} added to stock.`,
      });
      resetForm();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Could not receive stock', description: error.message || 'Failed to receive stock' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-12">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackagePlus className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Add Stock</h1>
              <p className="text-sm text-muted-foreground">Receive incoming units against a SKU and attach the supplier invoice.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/admin/stock-purchase/history/">
                <History className="h-4 w-4" />
                Invoice history
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/admin/products">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <Card className={cn(FLUSH_CARD, 'border')}>
              <PanelHeader icon={Truck} title="Supplier" hint="Who the stock is coming from." done={!!selectedSupplier} />
              <div className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <FormField
                  control={control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormControl>
                        <SelectSearch
                          placeholder="Select a supplier *"
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
                <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5" onClick={() => setShowAddSupplier(true)}>
                  <Plus className="h-4 w-4" />
                  New supplier
                </Button>
              </div>
            </Card>

            <Card className={cn(FLUSH_CARD, 'overflow-hidden border')}>
              <PanelHeader
                icon={Package}
                title="Lines to receive"
                hint="Pick the product to narrow the list, then the SKU, then quantity and unit cost."
                done={hasReadyItem && readyItems === fields.length}
                right={
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                    {readyItems}/{fields.length} ready
                  </span>
                }
              />
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-4 py-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2 font-medium text-primary hover:bg-primary/5 hover:text-primary"
                  onClick={() => append(blankLine())}
                >
                  <Plus className="h-4 w-4" />
                  Add another line
                </Button>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-semibold tabular-nums text-foreground">{totalUnits}</span> units
                  </span>
                  <span className="text-muted-foreground">
                    Total <span className="font-semibold tabular-nums text-foreground">{formatPrice(totalCost)}</span>
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-5 lg:sticky lg:top-4">
            <Card className={cn(FLUSH_CARD, 'border')}>
              <PanelHeader icon={Receipt} title="Invoice" hint="Only the number is required." done={!!watch('invoiceNumber')} />
              <div className="space-y-4 px-5 py-4">
                <FormField
                  control={control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">Invoice number *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. INV-12345" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setShowOptional((v) => !v)}
                    aria-expanded={showOptional}
                    aria-controls="invoice-optional"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', !showOptional && '-rotate-90')} />
                    <span className="flex-1">
                      Invoice file &amp; notes <span className="font-normal">(optional)</span>
                    </span>
                    {!showOptional && (invoiceFile || notes) && (
                      <span className="truncate rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">
                        {[invoiceFile ? 'file attached' : null, notes ? 'has notes' : null].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </button>
                  <div id="invoice-optional" className={cn('space-y-4 border-t px-3 pb-3 pt-3', !showOptional && 'hidden')}>
                    <div className="space-y-1">
                      <FormLabel className="text-xs">Invoice file</FormLabel>
                      {!invoiceFile ? (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => document.getElementById('invoice-upload')?.click()}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && document.getElementById('invoice-upload')?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={onDrop}
                          className={cn(
                            'group flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
                            isDragging ? 'border-primary bg-primary/5' : 'border-input hover:border-primary hover:bg-muted/40'
                          )}
                        >
                          <Input
                            id="invoice-upload"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => acceptInvoice(e.target.files?.[0])}
                          />
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                            <UploadCloud className="h-5 w-5" />
                          </span>
                          <p className="text-sm font-medium">{isDragging ? 'Drop to attach' : 'Click or drag the invoice here'}</p>
                          <p className="text-xs text-muted-foreground">PDF, JPG or PNG up to {INVOICE_MAX_MB}MB</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background">
                            {invoicePreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={invoicePreview} alt="" className="h-full w-full object-cover" />
                            ) : invoiceFile.type.startsWith('image/') ? (
                              <ImageIcon className="h-5 w-5 text-primary" />
                            ) : (
                              <FileText className="h-5 w-5 text-primary" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{invoiceFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(invoiceFile.size / 1024 / 1024).toFixed(2)} MB · uploads when you submit
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={clearInvoice}
                            aria-label="Remove invoice file"
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
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs">Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              className="resize-none"
                              rows={2}
                              placeholder="Anything to record against this delivery (optional)"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border">
              <h2 className="text-sm font-bold">Summary</h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Supplier</dt>
                  <dd className="max-w-[60%] truncate font-medium">{selectedSupplier?.name ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Lines</dt>
                  <dd className="font-medium tabular-nums">{fields.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Units</dt>
                  <dd className="font-medium tabular-nums">{totalUnits}</dd>
                </div>
              </dl>

              <div className="my-3 border-t" />

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">Total cost</span>
                <span className="text-2xl font-bold tabular-nums text-primary">{formatPrice(totalCost)}</span>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {hasReadyItem ? `${readyItems} of ${fields.length} ${fields.length === 1 ? 'line' : 'lines'} ready` : 'No line is ready yet'}
                  </span>
                  <span className="tabular-nums">{readyPercent}%</span>
                </div>
                <Progress value={readyPercent} className={cn('h-1.5', readyPercent === 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-amber-500')} />
              </div>

              <Button type="submit" size="lg" className="mt-4 w-full gap-2" loading={isSubmitting}>
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting ? 'Receiving…' : 'Receive stock'}
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                {hasReadyItem ? 'Stock is added the moment this is saved.' : 'Pick a product, then its SKU, and add quantity and unit cost.'}
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 w-full gap-1.5 text-muted-foreground"
                disabled={isSubmitting || !hasUnsavedInput}
                onClick={() => setShowResetConfirm(true)}
              >
                <RotateCcw className="h-4 w-4" />
                Reset form
              </Button>
            </Card>
          </div>
        </form>
      </Form>

      {showAddSupplier && <ManageSupplier isOpen={showAddSupplier} onClose={() => setShowAddSupplier(false)} />}

      <ConfirmBox
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onSubmit={() => {
          resetForm();
          setShowResetConfirm(false);
          toast({ variant: 'success', title: 'Form reset', description: 'All entered details have been cleared.' });
        }}
        heading="Reset this form?"
        bodyText="The supplier, every line and the invoice details will be cleared. This can't be undone."
        yesButtonText="Reset form"
        noButtonText="Keep editing"
        variant="danger"
      />
    </div>
  );
}

interface PanelHeaderProps {
  icon: typeof Package;
  title: string;
  hint: string;
  done?: boolean;
  right?: React.ReactNode;
}

function PanelHeader({ icon: Icon, title, hint, done, right }: PanelHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b px-5 py-3.5">
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
          done ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
        )}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold leading-tight">{title}</h2>
        <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
      </div>
      {right}
    </div>
  );
}
