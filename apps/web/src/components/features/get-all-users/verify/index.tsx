'use client';
import Loader from '@/components/common/Loader';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { OTPModel } from '@/models/otp.model';
import { useSendOtp, useVerifyOtp } from '@/hooks/service-hooks/useUserList.service.hook';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import { toast } from '@/components/ui/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { CardTitle } from '@/components/ui/card';
import OtpSchema from '@/schema/otp.Schema';

export default function ManageVerify() {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const addGrade = useVerifyOtp();

  const form = useForm<OTPModel>({
    resolver: yupResolver(OtpSchema),
    defaultValues: {
      otp: '' as unknown as number,
    },
  });

  const { handleSubmit } = form;

  const submitData = async (model: OTPModel) => {
    const response = await addGrade.mutateAsync(Number(model.otp));

    if (response && response.status === 200 && response.data?.data) {
      toast({
        title: 'OTP Verified successfully',
      });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: <span>{error}</span>,
      });
    }
  };

  const sendOtpMutation = useSendOtp();

  const handleSendOtp = async () => {
    try {
      const response = await sendOtpMutation.mutateAsync();
      if (response && (response.status === 200 || response.status === 201)) {
        toast({ title: 'OTP sent successfully' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to send OTP' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'An error occurred' });
    }
  };

  const isLoading = sendOtpMutation.isPending || addGrade.isPending;

  return (
    <>
      {isLoading && <Loader />}
      <CardTitle>Send Otp</CardTitle>
      <Button type="button" onClick={handleSendOtp} disabled={sendOtpMutation.isPending}>
        {sendOtpMutation.isPending ? 'Sending...' : 'Send Otp'}
      </Button>

      <Form {...form}>
        <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="grid gap-4">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OTP*</FormLabel>
                <FormControl>
                  <InputOTP maxLength={4} {...field} value={String(field.value)} onChange={field.onChange}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="text-center">
            <Button type="submit" className="w-full md:w-auto">
              Save
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
