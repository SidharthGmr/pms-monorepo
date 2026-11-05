'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetMyStore, useUpdateMyStore, useUploadStoreLogo } from '@/hooks/service-hooks/useStoreService';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { myStoreFields, UpdateMyStoreModel } from '@pms/types';
import { AlertCircle, ImageOff, Save, Store as StoreIcon, Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

const SURFACE = 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm';

/**
 * Edits the signed-in admin's own store through the self-service API (PUT /stores/my-store):
 * contact details and branding only. Code, status and isActive belong to the super admin's
 * full edit on the Stores screen.
 */
export default function StoreTab() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { data, isLoading, isError } = useGetMyStore();
  const store = data?.data?.data;

  const updateMyStore = useUpdateMyStore();
  const uploadLogo = useUploadStoreLogo();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UpdateMyStoreModel>({
    resolver: zodResolver(myStoreFields),
    defaultValues: { name: '', phone: '', email: '', siteName: '', storeLogo: '' },
  });

  useEffect(() => {
    if (store) {
      form.reset({
        name: store.name,
        phone: store.phone ?? '',
        email: store.email ?? '',
        siteName: store.siteName ?? '',
        storeLogo: store.storeLogo ?? '',
      });
    }
  }, [store, form]);

  const handleLogoFile = async (file: File | undefined) => {
    if (!file || uploadLogo.isPending) return;
    try {
      const uploaded = await uploadLogo.mutateAsync({ file });
      form.setValue('storeLogo', uploaded.url, { shouldDirty: true });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: (error as Error)?.message || 'The logo could not be uploaded.' });
    } finally {
      // Reset so picking the SAME file again still fires onChange.
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const submitData = async (model: UpdateMyStoreModel) => {
    const response = await updateMyStore.mutateAsync(model);
    if (response && response.status === 200) {
      toast({ variant: 'success', title: 'Store updated successfully' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  return (
    <section className={cn(SURFACE, 'overflow-hidden')}>
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <StoreIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight">Store information</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Name, contact details and the logo shown on invoices and emails.</p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {isLoading ? (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            <Skeleton className="h-10" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        ) : isError || !store ? (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Could not load your store</p>
              <p className="text-xs text-muted-foreground">Refresh the page to try again.</p>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form autoComplete="off" onSubmit={form.handleSubmit(submitData)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Main Branch" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. +1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="e.g. store@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="siteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Brand name on invoices & emails" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="storeLogo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Logo</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                          {field.value ? (
                            // Blob URLs are not in next.config's remotePatterns, so a plain <img> is correct here.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={field.value} alt="Store logo" className="max-h-full max-w-full object-contain" />
                          ) : (
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(event) => handleLogoFile(event.target.files?.[0])}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          icon={UploadCloud}
                          iconPlacement="left"
                          loading={uploadLogo.isPending}
                          onClick={() => logoInputRef.current?.click()}
                        >
                          {field.value ? 'Replace' : 'Upload'}
                        </Button>
                        {field.value && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Remove logo"
                            onClick={() => form.setValue('storeLogo', '', { shouldDirty: true })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" icon={Save} iconPlacement="left" loading={updateMyStore.isPending}>
                  Save changes
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </section>
  );
}
