'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useUnlockCmsPage } from '@/hooks/service-hooks/useCmsPageService';
import { pageAccessCookie, storeAccessCookie } from '@/lib/page-access';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { CmsPageConditionForm, CmsPageLockReason, LockedCmsPagePreviewDto } from '@pms/types';
import { Eye, EyeOff, ClipboardCheck, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

interface PageLockProps {
  slug: string;
  reason: CmsPageLockReason;
  conditionForm: CmsPageConditionForm | null;
  preview: LockedCmsPagePreviewDto;
}

/**
 * What a visitor sees instead of a gated page. The content never reaches the browser here -
 * a correct password earns a signed token (stored as a cookie) and the server re-renders the
 * page with it; a form-gated page points at the form, whose submission sets the token cookie.
 */
export default function PageLock({ slug, reason, conditionForm, preview }: PageLockProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const router = useRouter();
  const unlockMutation = useUnlockCmsPage();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password) return;
    setError(null);

    const response = await unlockMutation.mutateAsync({ slug, password });
    if (response && response.status === 200 && response.data.data) {
      setUnlocking(true);
      storeAccessCookie(pageAccessCookie(slug), response.data.data.accessToken);
      // The cookie is in place - the server now renders the real page, scripts and all.
      router.refresh();
    } else {
      setError(unitOfService.ErrorHandlerService.getErrorMessage(response));
    }
  };

  return (
    <main className="mx-auto flex min-h-[55vh] w-full max-w-md flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <span className="rounded-full bg-muted p-4 text-muted-foreground">
        {reason === 'password' ? <Lock className="h-7 w-7" /> : <ClipboardCheck className="h-7 w-7" />}
      </span>
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">{preview.name}</h1>
        <p className="text-sm text-muted-foreground">
          {reason === 'password' ? 'This page is password protected. Enter the password to view it.' : 'This page unlocks after you submit a form.'}
        </p>
      </div>

      {reason === 'password' ? (
        <form onSubmit={submit} className="w-full space-y-3">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Page password"
              autoFocus
              aria-label="Page password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={!password || unlockMutation.isPending || unlocking}>
            {(unlockMutation.isPending || unlocking) && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {unlocking ? 'Opening page…' : 'Unlock page'}
          </Button>
        </form>
      ) : (
        <Card className="w-full space-y-3 p-5 text-sm">
          {conditionForm === 'contact' ? (
            <>
              <p>Send us a message through the contact form, then come back - this page opens automatically.</p>
              <Button asChild className="w-full">
                <Link href="/contact-us">Go to the contact form</Link>
              </Button>
            </>
          ) : (
            <>
              <p>Subscribe to our newsletter, then come back - this page opens automatically.</p>
              <Button asChild className="w-full">
                <Link href="/">Go to the home page to subscribe</Link>
              </Button>
            </>
          )}
        </Card>
      )}
    </main>
  );
}
