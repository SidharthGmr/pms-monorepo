'use client';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { ChevronsRight, Home } from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';

export function BreadCrumb() {
    const items = useBreadcrumbs();
    if (items.length === 0) return null;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {items.map((item, index) => (
                    <Fragment key={item.link}>
                        {index !== items.length - 1 && (
                            <BreadcrumbItem className="hidden md:block ">
                                <Link href={item.link}>
                                    <Home className="h-4 w-4" />
                                </Link>
                            </BreadcrumbItem>
                        )}
                        {index < items.length - 1 && (
                            <BreadcrumbSeparator className="hidden md:block ">
                                <ChevronsRight />
                            </BreadcrumbSeparator>
                        )}
                        {index === items.length - 1 && <BreadcrumbPage className="">{item.title.replace(/-/g, ' ')}</BreadcrumbPage>}
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
