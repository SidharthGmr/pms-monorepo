'use client';
import * as React from 'react';
import Link from 'next/link'; 
import { CardDescription } from "../ui/card";
import { RiCopyrightLine } from "react-icons/ri";



export function Footer() {

    return (
        <footer className="text-center py-4 bg-card overflow-hidden hidden">
            <CardDescription className="text-foreground text-sm">
                <RiCopyrightLine className="me-1 inline align-text-bottom" />
                {new Date().getFullYear()} | Powered by
                <Link href="#!" className="inline-block hover:underline ps-1" title="ShotMail" target="_blank" rel="noopener noreferrer">
                    ShotMail
                </Link>
            </CardDescription>
        </footer>
    );
}
