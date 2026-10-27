'use client';
import { cn } from '@/lib/utils';
import { fieldMaxLength } from '@pms/types';
import { z } from 'zod';

interface CharCounterProps<T extends z.ZodRawShape> {
  schema: z.ZodObject<T>;
  field: keyof T & string;
  value: string;
  className?: string;
}

export default function CharCounter<T extends z.ZodRawShape>({ schema, field, value, className }: CharCounterProps<T>) {
  const max = fieldMaxLength(schema, field);
  if (!max) return null;
  return (
    <span className={cn('text-[11px] tabular-nums text-muted-foreground', value.length > max && 'text-destructive', className)}>
      {value.length}/{max}
    </span>
  );
}
