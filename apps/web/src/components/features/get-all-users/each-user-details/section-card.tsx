import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export default function SectionCard({
    icon,
    title,
    badge,
    tone = 'default',
    collapsible = false,
    children,
}: {
    icon?: ReactNode;
    title: string;
    badge?: ReactNode;
    tone?: 'default' | 'destructive';
    collapsible?: boolean;
    children: ReactNode;
}) {
    const isDestructive = tone === 'destructive';

    const headerContent = (
        <>
            {icon && <span
                className={cn(
                    'grid h-7 w-7 shrink-0 place-content-center rounded-md',
                    isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                )}
            >
                {icon}
            </span>}
            <CardTitle className={cn('mb-0 flex-1 text-sm font-bold uppercase', isDestructive && 'text-destructive')}>{title}</CardTitle>
            {badge}
        </>
    );

    if (collapsible) {
        return (
            <Card className="!p-0 overflow-hidden border-border/60 shadow-sm">
                <Accordion type="single" collapsible>
                    <AccordionItem value="section" className="rounded-none border-0 data-[state=open]:border-0">
                        <AccordionTrigger
                            className={cn(
                                'flex items-center gap-2.5 rounded-none border-0 border-b p-0 px-3 py-2.5 [&[data-state=open]>svg]:rotate-180',
                                'hover:no-underline',
                                isDestructive ? 'bg-destructive/10' : 'bg-background hover:bg-accent/40'
                            )}
                        >
                            {headerContent}
                        </AccordionTrigger>
                        <AccordionContent className="p-0">
                            <CardContent className="p-0 md:p-0">{children}</CardContent>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </Card>
        );
    }

    return (
        <Card className="!p-0 overflow-hidden border-border/60 shadow-sm">
            <div className={cn('flex items-center gap-2.5 border-b px-3 py-2.5', isDestructive ? 'bg-destructive/10' : 'bg-background')}>
                {headerContent}
            </div>
            <CardContent className="p-3 md:p-4">{children}</CardContent>
        </Card>
    );
}
