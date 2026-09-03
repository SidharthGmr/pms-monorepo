'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetUserById, useUpdateUser } from '@/hooks/service-hooks/useUserList.service.hook';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { zodResolver } from '@/lib/zod-resolver';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { profileValidator, UpdateProfileModel, UserDto } from '@pms/types';
import Response from '@/dtos/Response';
import { AxiosResponse } from 'axios';
import DateTimePicker from '@/components/common/data-time-picker/date-time-picker';

interface EditUserProfileProps {
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
  userId: string;
}

export default function EditUserProfile({ isOpen, onClose, userId }: EditUserProfileProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const updateUser = useUpdateUser();
  const [showLoader, setShowLoader] = useState<boolean>(false);

  const { data: userData, isLoading: isFetching } = useGetUserById(userId, !!userId);

  const form = useForm<UpdateProfileModel>({
    resolver: zodResolver(profileValidator),
    defaultValues: {
      name: '',
      userName: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (userData?.data?.data) {
      const user = userData.data.data;
      form.reset({
        name: user.name || '',
        userName: user.userName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        pincode: user.pincode || '',
        bio: user.bio || '',
      });
    }
  }, [userData, form]);

  const { handleSubmit } = form;

  const submitData = async (model: UpdateProfileModel) => {
    const formData = new FormData();

    Object.keys(model).forEach((key) => {
      const value = model[key as keyof UpdateProfileModel];
      if (key === 'dateOfBirth' && model[key] !== undefined) {
        formData.append(key, new Date(value as string).toISOString());
      } else {
        formData.append(key, value as string);
      }
    });

    let response: AxiosResponse<Response<UserDto>>;
    setShowLoader(true);

    response = await updateUser.mutateAsync({ id: userId, model: formData });

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: 'Profile updated successfully' });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = updateUser.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
        </DialogHeader>

        {isFetching ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <Form {...form}>
            <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Emi Offer Price*" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Emi Offer Price*" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Emi Offer Price*" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <DateTimePicker
                            placeholder="Select Date"
                            mode="single"
                            value={field.value ? new Date(field.value) : undefined}
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ?? undefined)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Emi Offer Price*" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Emi Offer Price*" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Emi Offer Price*" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input placeholder="Emi Offer Price*" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Emi Offer Price*" className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
