'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from '@/components/ui/use-toast';
import { FaArrowRight, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; 
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import ResetPasswordModel from '@/models/ResetPasswordModel';
import ResetPasswordSchema from '@/schema/ResetPasswordSchema';
import { useResetPassword, useSendOtp } from '@/hooks/service-hooks/useUserList.service.hook';

export default function RecoverPasswordModule() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();


    const sendOtpMutation = useSendOtp();
    const resetPasswordMutation = useResetPassword();
    const handleSendOtp = useCallback(async () => {
        try {
            const response = await sendOtpMutation.mutateAsync();
            if (response && (response.status === 200 || response.status === 201)) {
                toast({ title: "OTP sent successfully" });
            } else {
                toast({ variant: "destructive", title: "Error", description: "Failed to send OTP" });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "An error occurred" });
        }
    }, [sendOtpMutation, toast]);

    useEffect(() => {
        handleSendOtp();
    }, [handleSendOtp]);



    const form = useForm<ResetPasswordModel>({
        resolver: yupResolver(ResetPasswordSchema),
        defaultValues: {
            otp: '',
            password: '',
            confirmPassword: '',
        },
    });

    const { handleSubmit, control, reset } = form;

    const submitData = async (data: ResetPasswordModel) => {
        setIsLoading(true);
        const response = await resetPasswordMutation.mutateAsync(data);
        if (response && (response.status === 200 || response.status === 201)) {
            toast({
                variant: 'default',
                description: 'Password reset successfully!',
            });
            reset();
            router.push('/login'); // Redirect to login after success
        } else {
            setIsLoading(false);
            toast({
                variant: 'destructive',
                description: 'Failed to reset password. Please try again.',
            });
        }
        setIsLoading(false);

    };

    return (
        <div className="min-h-screen flex bg-black text-white">
            {/* Left Side - Hero / Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40 z-10" />
                <Image
                    src="/sign-login.jpg"
                    alt="Reset Password Background"
                    fill
                    className="object-cover opacity-40 mix-blend-overlay"
                    priority
                />
                <div className="relative z-20 flex flex-col justify-between p-12 h-full text-white">
                    <Link href="/" className="inline-block" title="ShotMailer">
                        <Image
                            src="/logo-full.svg" width={180} height={50} alt="ShotMailer" className="dark:grayscale" />
                    </Link>
                    <div className="max-w-md">
                        <blockquote className="space-y-4">
                            <p className="text-2xl font-medium leading-relaxed">
                                &ldquo;Secure your account and get back to building better email experiences.&rdquo;
                            </p>
                            <footer className="text-sm text-gray-400 font-medium tracking-wide uppercase">
                                — The Team
                            </footer>
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-black">
                <div className="w-full max-w-lg space-y-8">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Reset Password
                        </h1>
                        <p className="text-sm text-gray-400">
                            Enter your OTP and new password below
                        </p>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                        <Form {...form}>
                            <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">


                                <FormField
                                    control={control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-300">New Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Enter new password"
                                                    {...field}
                                                    className="bg-gray-950 border-gray-800 text-white placeholder:text-gray-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-300">Confirm Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Confirm new password"
                                                    {...field}
                                                    className="bg-gray-950 border-gray-800 text-white placeholder:text-gray-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name="otp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-300">OTP</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter OTP"
                                                    {...field}
                                                    className="bg-gray-950 border-gray-800 text-white placeholder:text-gray-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-6 mt-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <FaSpinner className="animate-spin" />
                                            Resetting...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Reset Password
                                            <FaArrowRight />
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </Form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-500">
                                Remember your password?{' '}
                                <Link
                                    href="/login"
                                    className="font-medium text-blue-500 hover:text-blue-400 transition-colors"
                                >
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
