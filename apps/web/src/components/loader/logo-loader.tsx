
import * as React from 'react';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

interface LogoLoaderProps {
    title?: string;
    description?: string;
    className?: string;
}

export function LogoLoader({ title, description, className }: LogoLoaderProps) {
    return (
        <div className={`grid gap-4  place-content-center  h-full ${className}`}>
            <Card className="space-y-4 text-center">
                <div className="text-center">
                    <Image
                        src="https://www.transcriptioncertificationinstitute.org/images/loader.gif"
                        width={400}
                        height={0}
                        className="inline-block"
                        alt="Data Not Found"
                    />
                </div>
                {title && description &&
                    <>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </>
                }
            </Card>
        </div >
    );
}