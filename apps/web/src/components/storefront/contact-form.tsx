'use client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CONTACT } from '@/data/theme.config';
import { useCreatePublicContactMessage } from '@/hooks/service-hooks/useContactMessageService';
import { zodResolver } from '@/lib/zod-resolver';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { contactMessageFields, CreateContactMessageModel } from '@pms/types';
import { CheckCircle2, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FORM_ACCESS_COOKIE, storeAccessCookie } from '@/lib/page-access';

const DEFAULT_VALUES: CreateContactMessageModel = { name: '', email: '', phone: '', subject: '', message: '' };

// The public half of contact-messages: validated by the same zod fields the API enforces,
// posted without a bearer token, and swapped for a thank-you card once it lands.
export default function ContactForm() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const mutation = useCreatePublicContactMessage();
  const [sent, setSent] = useState(false);

  const form = useForm<CreateContactMessageModel>({
    resolver: zodResolver(contactMessageFields),
    defaultValues: DEFAULT_VALUES,
  });

  const submit = form.handleSubmit(async (model) => {
    const response = await mutation.mutateAsync(model);

    if (response && response.status === 201) {
      // Unlocks any CMS page conditioned on the contact form (see lib/page-access.ts).
      const formToken = (response.data?.data as { formToken?: string } | undefined)?.formToken;
      if (formToken) storeAccessCookie(FORM_ACCESS_COOKIE, formToken);
      setSent(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Could not send your message', description: <span>{error}</span> });
    }
  });

  if (sent) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-border/70 bg-card p-10 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15 text-secondary">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="text-lg font-bold text-foreground">{CONTACT.form.successTitle}</h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{CONTACT.form.successBody}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-2 rounded-full"
          onClick={() => {
            form.reset(DEFAULT_VALUES);
            setSent(false);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-foreground">{CONTACT.form.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{CONTACT.form.body}</p>

      <Form {...form}>
        <form onSubmit={submit} autoComplete="off" className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Priya Sharma" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Optional" autoComplete="tel" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <Input placeholder="What is this about?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us what you need - an order number helps if it is about an order."
                    rows={6}
                    className="resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" loading={mutation.isPending} className="h-11 gap-2 rounded-full px-7 font-semibold">
            {!mutation.isPending && <Send className="h-4 w-4" />}
            {CONTACT.form.cta}
          </Button>
        </form>
      </Form>
    </div>
  );
}
