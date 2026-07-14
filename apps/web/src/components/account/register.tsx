'use client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import config from '@/config';
import { CreateUserModel } from '@/models/user.model';
import SignupSchema from '@/schema/userSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import { Lock, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { CardDescription } from '../ui/card';
import { Switch } from '../ui/switch';

export default function RegisterModule() {
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
    <Form {...form}>
      <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name*</FormLabel>
                <FormControl>
                  <Input placeholder="John" icon={User} {...field} />
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
                <FormLabel>Last Name*</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" icon={User} {...field} />
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
              <FormLabel>Business Email*</FormLabel>
              <FormControl>
                <Input type="email" placeholder="name@company.com" icon={Mail} {...field} />
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
              <FormLabel>Phone*</FormLabel>
              <FormControl>
                <Input type="text" placeholder="(555) 000-0000" icon={Phone} {...field} />
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
              <FormLabel>Password*</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Create a password" icon={Lock} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isRegisterbyShop"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border bg-background px-3 py-2.5">
              <FormLabel className="!mt-0 font-medium">Register as Shop</FormLabel>
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
          iconPlacement="right"
          className="w-full transition-all duration-300 hover:scale-[1.02]"
          loading={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>

        <div className="text-center">
          <CardDescription>
            Already have an account?
            <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors ms-1">
              Log in now
            </Link>
          </CardDescription>
        </div>
      </form>
    </Form>
  );
}
