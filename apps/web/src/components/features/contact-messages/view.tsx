'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetContactMessageById, useUpdateContactMessageStatus } from '@/hooks/service-hooks/useContactMessageService';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ContactMessageStatusEnum } from '@pms/types';
import { format } from 'date-fns';
import { CheckCircle2, Mail, Phone, RotateCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { messageToneFor } from './message-status';

interface ViewContactMessageProps {
  id: number;
  isOpen: boolean;
  onClose: () => void;
}

// Reading a message is what marks it read - the same contract as a mail client, so the NEW
// filter stays an honest to-do list without anyone managing a status by hand.
export default function ViewContactMessage({ id, isOpen, onClose }: ViewContactMessageProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const detailQuery = useGetContactMessageById(id, isOpen);
  const statusMutation = useUpdateContactMessageStatus();
  const markedRef = useRef(false);

  const message = detailQuery.data?.data?.data;

  useEffect(() => {
    if (!message || markedRef.current) return;
    if (message.status === ContactMessageStatusEnum.New) {
      markedRef.current = true;
      statusMutation.mutate({ id: message.id, model: { status: ContactMessageStatusEnum.Read } });
    }
  }, [message, statusMutation]);

  const setStatus = async (status: ContactMessageStatusEnum) => {
    const response = await statusMutation.mutateAsync({ id, model: { status } });
    if (response && response.status === 200) {
      toast({ variant: 'success', title: status === ContactMessageStatusEnum.Resolved ? 'Marked resolved' : 'Reopened' });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Could not update status', description: <span>{error}</span> });
    }
  };

  const tone = messageToneFor(message?.status);
  const isResolved = message?.status === ContactMessageStatusEnum.Resolved;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl gap-0 p-0">
        {detailQuery.isPending ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : !message ? (
          <p className="p-6 text-sm text-destructive">Could not load this message.</p>
        ) : (
          <>
            <DialogHeader className="border-b border-border/70 p-5 pr-10 text-left">
              <div className="flex items-center gap-2">
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold', tone.soft, tone.text)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
                  {tone.label}
                </span>
                <span className="text-[11px] tabular-nums text-muted-foreground">{format(new Date(message.createdAt), 'd MMM yyyy, HH:mm')}</span>
              </div>
              <DialogTitle className="mt-1.5 text-base leading-snug">{message.subject}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="font-medium text-foreground">{message.name}</span>
                <a href={`mailto:${message.email}`} className="inline-flex items-center gap-1 hover:text-foreground hover:underline">
                  <Mail className="h-3 w-3" />
                  {message.email}
                </a>
                {message.phone && (
                  <a href={`tel:${message.phone}`} className="inline-flex items-center gap-1 hover:text-foreground hover:underline">
                    <Phone className="h-3 w-3" />
                    {message.phone}
                  </a>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[50vh] overflow-y-auto p-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{message.message}</p>
            </div>

            <DialogFooter className="flex-row justify-between gap-2 border-t border-border/70 bg-muted/30 p-4 sm:justify-between">
              <Button asChild variant="outline" className="h-9 gap-1.5">
                <a href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}>
                  <Mail className="h-4 w-4" />
                  Reply by email
                </a>
              </Button>
              {isResolved ? (
                <Button type="button" variant="ghost" className="h-9 gap-1.5" loading={statusMutation.isPending} onClick={() => setStatus(ContactMessageStatusEnum.Read)}>
                  <RotateCcw className="h-4 w-4" />
                  Reopen
                </Button>
              ) : (
                <Button type="button" className="h-9 gap-1.5" loading={statusMutation.isPending} onClick={() => setStatus(ContactMessageStatusEnum.Resolved)}>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark resolved
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
