'use client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { CreateUserModel } from '@/models/user.model';
import SignupSchema from '@/schema/userSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { CardDescription } from '../ui/card';
import { Switch } from '../ui/switch';

export default function RegisterModule() {
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<CreateUserModel>({
    resolver: yupResolver(SignupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      isRegisterbyShop: false,
    },
  });

  const { handleSubmit, control } = form;

  const submitData = async (data: CreateUserModel) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${config.apiBaseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        form.reset();

        setShowLoader(false);
        toast({
          title: 'Success',
          description: 'Registered successfully!',
          variant: 'success',
        });

        form.reset();
        router.push('/login/');
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="">
        {showLoader && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16">Loading...</div>
          </div>
        )}
      </div>
      <Form {...form}>
        <form autoComplete="off" onSubmit={handleSubmit(submitData)}>
          <div className="grid grid-cols-2 gap-1">
            <FormField
              control={control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="(555) 000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Create a password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isRegisterbyShop"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormLabel className="mt-2">Register as Shop</FormLabel>
                <FormControl>
                  <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            icon={FaArrowUpRightFromSquare}
            className="w-full  transition-all duration-300 hover:scale-[1.02]"
            loading={showLoader}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
          <div className="my-4 text-center">
            <CardDescription>
              Already have an account?
              <Link href="/login" className="font-medium text-blue-500 hover:text-blue-400 transition-colors ms-1">
                Log in now
              </Link>
            </CardDescription>
          </div>
        </form>
      </Form>
    </>
  );
}
