import { cn } from '@/lib/utils';
import { EstimateDto, EstimateStatus, EstimateStatusEnum } from '@pms/types';

// An estimate past its validity that is still being negotiated reads as Expired everywhere,
// even though the stored status only flips when a transition is attempted (the API refuses
// accept/convert on it either way).
export const displayStatusOf = (estimate: Pick<EstimateDto, 'status' | 'validUntil'>): EstimateStatus => {
  const negotiating = estimate.status === EstimateStatusEnum.Draft || estimate.status === EstimateStatusEnum.Sent;
  if (negotiating && estimate.validUntil && new Date(estimate.validUntil).getTime() < Date.now()) return EstimateStatusEnum.Expired;
  return estimate.status;
};

const TONES: Record<EstimateStatus, { label: string; className: string; dot: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-slate-500/20', dot: 'bg-slate-500' },
  SENT: { label: 'Sent', className: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/20', dot: 'bg-sky-500' },
  ACCEPTED: { label: 'Accepted', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/20', dot: 'bg-rose-500' },
  EXPIRED: { label: 'Expired', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20', dot: 'bg-amber-500' },
  CONVERTED: { label: 'Converted', className: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/20', dot: 'bg-violet-500' },
  CANCELLED: { label: 'Cancelled', className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 ring-zinc-500/20', dot: 'bg-zinc-500' },
};

export default function EstimateStatusBadge({ status, className }: { status: EstimateStatus; className?: string }) {
  const tone = TONES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        tone.className,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
      {tone.label}
    </span>
  );
}
