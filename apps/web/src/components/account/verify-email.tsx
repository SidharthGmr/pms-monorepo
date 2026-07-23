'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { CardDescription } from '@/components/ui/card';
import { useVerifyToken } from '@/hooks/service-hooks/useAccountService';
import { toast } from '../ui/use-toast';

type VerifyStatus = 'verifying' | 'success' | 'error';

const STATUS_META: Record<VerifyStatus, { title: string; badge: string; icon: string }> = {
  verifying: {
    title: 'Verifying…',
    badge: 'bg-primary/10',
    icon: 'text-primary',
  },
  success: {
    title: 'Email verified',
    badge: 'bg-emerald-500/10',
    icon: 'text-emerald-600',
  },
  error: {
    title: 'Verification failed',
    badge: 'bg-destructive/10',
    icon: 'text-destructive',
  },
};

export default function VerifyEmailModule() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerifyStatus>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email, please wait...');

  const verifyTokenMutation = useVerifyToken();

  const hasVerified = useRef(false);

  const verify = useCallback(async () => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token or is malformed.');
      return;
    }
    try {
      // The API expects a JSON body: { token }. Sending it through the service
      // (HttpService) also attaches the required clientId header.
      const response = await verifyTokenMutation.mutateAsync({ token });

      if (response && (response.status === 200 || response.status === 201) && response.data?.success) {
        setStatus('success');
        setMessage(response.data.message || 'Your email has been verified successfully.');
        toast({
          title: 'Success',
          description: 'Your email has been verified successfully!',
          variant: 'success',
        });
      } else {
        setStatus('error');
        setMessage(response?.data?.message || 'We could not verify your email. The link may have expired.');
        toast({
          variant: 'destructive',
          description: response?.data?.message || 'We could not verify your email. The link may have expired.',
        });
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      setStatus('error');
      setMessage('Something went wrong while verifying your email. Please try again.');
      toast({
        variant: 'destructive',
        description: 'Something went wrong while verifying your email. Please try again.',
      });
    }
  }, [token]);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;
    verify();
  }, [verify]);

  const meta = STATUS_META[status];

  return (
    <div className="space-y-6 text-center">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${meta.badge}`}>
        {status === 'verifying' && <Loader2 className={`h-8 w-8 animate-spin ${meta.icon}`} />}
        {status === 'success' && <CheckCircle2 className={`h-8 w-8 ${meta.icon}`} />}
        {status === 'error' && <AlertTriangle className={`h-8 w-8 ${meta.icon}`} />}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{meta.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
      </div>

      {status === 'success' && (
        <Button
          type="button"
          icon={FaArrowUpRightFromSquare}
          iconPlacement="right"
          className="w-full transition-all duration-300 hover:scale-[1.02]"
          onClick={() => router.push('/login')}
        >
          Continue to Sign in
        </Button>
      )}

      {status === 'error' && (
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to Sign in</Link>
        </Button>
      )}

      <div className="pt-2">
        <CardDescription>
          Already verified?
          <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors ms-1">
            Sign in
          </Link>
        </CardDescription>
      </div>
    </div>
  );
}
