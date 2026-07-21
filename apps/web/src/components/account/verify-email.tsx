'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaArrowRight, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import config from '@/config';
import { toast } from '../ui/use-toast';

type VerifyStatus = 'verifying' | 'success' | 'error';

const STATUS_META: Record<VerifyStatus, { subtitle: string; title: string; ring: string; glow: string }> = {
  verifying: {
    subtitle: 'Confirming your email address',
    title: 'Verifying…',
    ring: 'border-blue-500/30 bg-blue-500/10',
    glow: 'bg-blue-500',
  },
  success: {
    subtitle: 'Your email address is confirmed',
    title: 'Email verified',
    ring: 'border-green-500/30 bg-green-500/10',
    glow: 'bg-green-500',
  },
  error: {
    subtitle: 'We hit a snag confirming your email',
    title: 'Verification failed',
    ring: 'border-red-500/30 bg-red-500/10',
    glow: 'bg-red-500',
  },
};

export default function VerifyEmailModule() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerifyStatus>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email, please wait...');

  // Guard against React Strict Mode / re-renders firing the request twice.
  const hasVerified = useRef(false);

  const verify = useCallback(async () => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token or is malformed.');
      return;
    }
    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(token),
      });
      console.log('response', response);
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Your email has been verified successfully!',
          variant: 'success',
        });

        //router.push('/login/');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);

      toast({
        variant: 'destructive', // Changed to destructive for error
        description: 'Failed to create account. Please try again.',
      });
    }
    // try {
    //   const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    //   const response = await unitOfService.AccountService.verifyToken({ token });

    //   if (response && (response.status === 200 || response.status === 201) && response.data?.success) {
    //     setStatus('success');
    //     setMessage(response.data.message || 'Your email has been verified successfully.');
    //   } else {
    //     setStatus('error');
    //     setMessage(response?.data?.message || 'We could not verify your email. The link may have expired.');
    //   }
    // } catch {
    //   setStatus('error');
    //   setMessage('Something went wrong while verifying your email. Please try again.');
    // }
  }, [token]);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;
    verify();
  }, [verify]);

  const heading = STATUS_META[status];

  return (
    <div className="min-h-screen flex bg-black text-white">
      {/* Left Side - Hero / Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40 z-10" />
        <Image src="/sign-login.jpg" alt="Verify Email Background" fill className="object-cover opacity-40 mix-blend-overlay" priority />
        <div className="relative z-20 flex flex-col justify-between p-12 h-full text-white">
          <Link href="/" className="inline-block" title="ShotMailer">
            <Image src="/logo-full.svg" width={180} height={50} alt="ShotMailer" className="dark:grayscale" />
          </Link>
          <div className="max-w-md">
            <blockquote className="space-y-4">
              <p className="text-2xl font-medium leading-relaxed">&ldquo;One quick step to secure your account and get started.&rdquo;</p>
              <footer className="text-sm text-gray-400 font-medium tracking-wide uppercase">— The Team</footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right Side - Status */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-black">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Email Verification
            </h1>

            <p className="text-sm text-gray-400">{heading.subtitle}</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-6 py-2">
              {/* Status badge with a soft glow halo */}
              <div className="relative flex items-center justify-center">
                <span
                  className={`absolute inline-flex h-24 w-24 rounded-full ${heading.glow} ${
                    status === 'verifying' ? 'animate-ping opacity-40' : 'opacity-20'
                  }`}
                />
                <div className={`relative flex h-20 w-20 items-center justify-center rounded-full border ${heading.ring}`}>
                  {status === 'verifying' && <FaSpinner className="animate-spin text-3xl text-blue-400" />}
                  {status === 'success' && <FaCheckCircle className="text-4xl text-green-400" />}
                  {status === 'error' && <FaExclamationTriangle className="text-4xl text-red-400" />}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">{heading.title}</h2>
                <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
              </div>

              {status === 'success' && (
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-4 mt-2 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  Continue to Sign in
                  <FaArrowRight />
                </button>
              )}

              {status === 'error' && (
                <Link
                  href="/login"
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-4 mt-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Back to Sign in
                </Link>
              )}
            </div>

            <div className="mt-8 border-t border-gray-800 pt-6 text-center">
              <p className="text-sm text-gray-500">
                Already verified?{' '}
                <Link href="/login" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
