'use client';

import React from 'react';

interface SetInnerHTMLProps {
    data: any;
    className?: string
}

export default function SetInnerHTML({ data, className }: SetInnerHTMLProps) {
    return (
        <div className={`${className && className} min-h-3`} dangerouslySetInnerHTML={{ __html: data }}
        />
    );
};


