import { ReactNode } from 'react';

interface FormSectionProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: ReactNode;
}

/** A titled group of related form fields, with a leading icon and helper text. */
export function FormSection({ icon: Icon, title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
