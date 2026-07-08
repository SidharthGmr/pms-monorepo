'use client';

import CommonProps from '@/props/CommonProps';
import { SessionProvider } from 'next-auth/react';

export default function AuthProvider({ children, }: CommonProps) {
  return <SessionProvider>{children}</SessionProvider>;
}






